from rest_framework import serializers
from .models import WorkSchedule, ShiftTemplate, UserSchedule

class WorkScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkSchedule
        fields = ['id', 'company', 'name', 'work_start', 'work_end', 'late_tolerance_min', 'overtime_threshold_min', 'is_active']
        read_only_fields = ['id', 'company']

class ShiftTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftTemplate
        fields = ['id', 'company', 'name', 'days', 'schedule']
        read_only_fields = ['id', 'company']

class UserScheduleSerializer(serializers.ModelSerializer):
    schedule_name = serializers.ReadOnlyField(source='schedule.name')
    
    class Meta:
        model = UserSchedule
        fields = ['id', 'user', 'company', 'schedule', 'schedule_name', 'effective_from', 'effective_to']
        read_only_fields = ['id', 'company']
