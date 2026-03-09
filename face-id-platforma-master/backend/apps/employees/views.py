from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.utils import get_request_company
from apps.roles.models import CustomRole
from apps.schedules.models import WorkSchedule, UserSchedule
from apps.attendance.models import AttendanceRecord
from apps.attendance.serializers import AttendanceRecordSerializer
from .serializers import (
    EmployeeSerializer,
    EmployeeCreateSerializer,
    AssignRoleSerializer,
    AssignScheduleSerializer,
)


class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company = get_request_company(self.request)
        if not company:
            return User.objects.none()
        return User.objects.filter(company=company, is_active=True).order_by('first_name', 'last_name')

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        employee = self.get_object()
        employee.is_active = False
        employee.save()
        return Response({'message': f'{employee.phone} deactivated'})

    @action(detail=True, methods=['post'], url_path='assign-role')
    def assign_role(self, request, pk=None):
        employee = self.get_object()
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_id = serializer.validated_data['role_id']

        try:
            role = CustomRole.objects.get(id=role_id, company=request.user.company)
        except CustomRole.DoesNotExist:
            return Response({'error': 'Role not found'}, status=status.HTTP_404_NOT_FOUND)

        employee.role = role
        employee.save()
        return Response({'message': f'Role "{role.name}" assigned to {employee.phone}'})

    @action(detail=True, methods=['post'], url_path='assign-schedule')
    def assign_schedule(self, request, pk=None):
        employee = self.get_object()
        serializer = AssignScheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule_id = serializer.validated_data['schedule_id']
        effective_from = serializer.validated_data['effective_from']

        try:
            schedule = WorkSchedule.objects.get(id=schedule_id, company=request.user.company)
        except WorkSchedule.DoesNotExist:
            return Response({'error': 'Schedule not found'}, status=status.HTTP_404_NOT_FOUND)

        # Close previous schedule
        UserSchedule.objects.filter(
            user=employee, company=request.user.company, effective_to__isnull=True
        ).update(effective_to=effective_from)

        UserSchedule.objects.create(
            user=employee,
            company=request.user.company,
            schedule=schedule,
            effective_from=effective_from
        )
        return Response({'message': f'Schedule "{schedule.name}" assigned'})

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        employee = self.get_object()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        qs = AttendanceRecord.objects.filter(user=employee, is_deleted=False).order_by('-date')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        serializer = AttendanceRecordSerializer(qs[:31], many=True)
        return Response({'results': serializer.data})
