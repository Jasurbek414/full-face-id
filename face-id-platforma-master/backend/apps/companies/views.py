from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Q
from .models import Company, Department, Branch
from .serializers import CompanySerializer, DepartmentSerializer, BranchSerializer
from apps.attendance.models import AttendanceRecord
from apps.accounts.models import User

METHOD_LABELS = {
    'face_id': 'Face ID',
    'pin': 'PIN',
    'manual': 'Manual',
    'qr': 'QR Code',
}

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(is_deleted=False)
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        company = request.user.company
        if not company:
            return Response({'detail': 'No company'}, status=403)
        today = timezone.now().date()

        records = AttendanceRecord.objects.filter(company=company, date=today, is_deleted=False)
        agg = records.aggregate(
            present=Count('id', filter=Q(status__in=['on_time', 'late', 'early_leave'])),
            late=Count('id', filter=Q(status='late')),
            absent=Count('id', filter=Q(status='absent')),
            total_net_seconds=Sum('net_seconds'),
        )
        present = agg['present'] or 0
        late = agg['late'] or 0
        absent = agg['absent'] or 0
        total_hours = round((agg['total_net_seconds'] or 0) / 3600.0, 1)

        total_employees = User.objects.filter(company=company, is_active=True).count()
        rate = (present / total_employees * 100) if total_employees > 0 else 0

        # Department breakdown via schedules (UserSchedule links user→company with schedule)
        # Since User model has no department FK, show per-department breakdown using schedules app
        try:
            from apps.schedules.models import UserSchedule
            dept_qs = (
                UserSchedule.objects
                .filter(company=company)
                .filter(Q(effective_to__gte=today) | Q(effective_to__isnull=True))
                .filter(effective_from__lte=today)
                .values('user_id')
                .distinct()
            )
            scheduled_user_ids = [u['user_id'] for u in dept_qs]
            total_scheduled = len(scheduled_user_ids)

            present_scheduled = records.filter(
                user_id__in=scheduled_user_ids,
                status__in=['on_time', 'late', 'early_leave']
            ).count()

            dept_breakdown = [{
                'department_name': company.name,
                'present': present_scheduled,
                'total': total_scheduled or total_employees,
            }]
        except Exception:
            dept_breakdown = [{
                'department_name': company.name,
                'present': present,
                'total': total_employees,
            }]

        # Check-in methods breakdown
        method_counts = (
            records.filter(status__in=['on_time', 'late', 'early_leave'])
            .values('check_in_method')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        total_checkins = sum(m['count'] for m in method_counts) or 1
        checkin_methods = [
            {
                'method': METHOD_LABELS.get(m['check_in_method'], m['check_in_method'] or 'Manual'),
                'count': m['count'],
                'pct': round(m['count'] / total_checkins * 100, 1),
            }
            for m in method_counts
        ]

        return Response({
            'present_today': present,
            'late_today': late,
            'absent_today': absent,
            'total_employees': total_employees,
            'total_hours': total_hours,
            'attendance_rate': round(rate, 1),
            'department_breakdown': dept_breakdown,
            'checkin_methods': checkin_methods,
        })

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company = getattr(self.request.user, 'company', None)
        if company:
            return Department.objects.filter(company=company, is_deleted=False)
        return Department.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)

class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company = getattr(self.request.user, 'company', None)
        if company:
            return Branch.objects.filter(company=company, is_deleted=False)
        return Branch.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)
