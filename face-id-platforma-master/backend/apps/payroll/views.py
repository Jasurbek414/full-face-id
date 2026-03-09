from datetime import datetime
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SalaryConfig, PayrollRecord
from .serializers import SalaryConfigSerializer, PayrollRecordSerializer
from .services import calculate_payroll
from apps.accounts.models import User

class SalaryConfigViewSet(viewsets.ModelViewSet):
    serializer_class = SalaryConfigSerializer

    def get_queryset(self):
        return SalaryConfig.objects.filter(company=self.request.user.company, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

class PayrollViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollRecordSerializer

    def get_queryset(self):
        user = self.request.user
        qs = PayrollRecord.objects.filter(company=user.company, is_deleted=False)
        if not user.is_staff:
            qs = qs.filter(user=user)
        return qs

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        month_str = request.data.get('month') # "2026-03"
        if not month_str:
            return Response({'error': 'month is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            month_date = datetime.strptime(month_str, '%Y-%m').date()
        except ValueError:
            return Response({'error': 'Invalid month format, use YYYY-MM'}, status=status.HTTP_400_BAD_REQUEST)
            
        users = User.objects.filter(company=request.user.company, is_active=True)
        count = 0
        for user in users:
            record = calculate_payroll(user, month_date)
            if record:
                count += 1
                
        return Response({'message': f'Calculated payroll for {count} employees'})

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        instance = self.get_object()
        instance.status = 'approved'
        instance.save()
        return Response({'status': 'approved'})

    @action(detail=False, methods=['get'])
    def my(self, request):
        qs = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        # Placeholder for export logic
        return Response({'message': 'Export feature coming soon'})
