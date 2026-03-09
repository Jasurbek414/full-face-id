from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum

from .models import LeaveType, LeaveRequest
from .serializers import LeaveTypeSerializer, LeaveRequestSerializer, LeaveBalanceSerializer

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.filter(is_deleted=False)
    serializer_class = LeaveTypeSerializer

    def get_queryset(self):
        return self.queryset.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.filter(is_deleted=False)
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset.filter(company=user.company)
        if not user.is_staff and not user.groups.filter(name='Manager').exists():
            qs = qs.filter(user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            company=self.request.user.company
        )

    @action(detail=False, methods=['get'])
    def my(self, request):
        qs = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        instance.status = 'approved'
        instance.approved_by = request.user
        instance.save()
        
        try:
            from apps.notifications.tasks import send_push_notification
            send_push_notification.delay(
                instance.user.id,
                "Leave Request Approved",
                f"Your leave request for {instance.start_date} to {instance.end_date} has been approved."
            )
        except Exception:
            pass
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        instance.status = 'rejected'
        instance.approved_by = request.user
        instance.save()
        
        try:
            from apps.notifications.tasks import send_push_notification
            send_push_notification.delay(
                instance.user.id,
                "Leave Request Rejected",
                f"Your leave request for {instance.start_date} to {instance.end_date} has been rejected."
            )
        except Exception:
            pass
        return Response({'status': 'rejected'})

    @action(detail=False, methods=['get'])
    def balance(self, request):
        types = LeaveType.objects.filter(company=request.user.company, is_deleted=False)
        results = []
        for lt in types:
            agg = LeaveRequest.objects.filter(
                user=request.user,
                leave_type=lt,
                status='approved',
                is_deleted=False
            ).aggregate(total=Sum('days'))
            used_days = agg.get('total') or 0
            
            results.append({
                'id': lt.id,
                'name': lt.name,
                'max_days_per_year': lt.max_days_per_year,
                'used_days': used_days,
                'remaining_days': max(0, lt.max_days_per_year - used_days)
            })
        
        serializer = LeaveBalanceSerializer(results, many=True)
        return Response(serializer.data)
