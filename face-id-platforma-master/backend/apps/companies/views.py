from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Company, Department, Branch
from .serializers import CompanySerializer, DepartmentSerializer, BranchSerializer
from apps.attendance.models import AttendanceRecord
from apps.accounts.models import User

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.filter(is_deleted=False)
    serializer_class = CompanySerializer
    # Only staff can manage companies globally, but users can see their own (implemented later with filtering)
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        company = request.user.company
        today = timezone.now().date()
        
        records = AttendanceRecord.objects.filter(company=company, date=today, is_deleted=False)
        present = records.filter(status__in=['on_time', 'late', 'early_leave']).count()
        late = records.filter(status='late').count()
        absent = records.filter(status='absent').count()
        
        total_employees = User.objects.filter(company=company, is_active=True).count()
        
        rate = (present / total_employees * 100) if total_employees > 0 else 0
        
        return Response({
            'present_today': present,
            'late_today': late,
            'absent_today': absent,
            'total_employees': total_employees,
            'attendance_rate': round(rate, 1)
        })

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by company from request (set by TenantMiddleware)
        if hasattr(self.request, 'company') and self.request.company:
            return Department.objects.filter(company=self.request.company, is_deleted=False)
        return Department.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.company)

class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request, 'company') and self.request.company:
            return Branch.objects.filter(company=self.request.company, is_deleted=False)
        return Branch.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.company)
