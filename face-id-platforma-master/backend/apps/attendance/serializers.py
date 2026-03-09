from rest_framework import serializers
from .models import AttendanceRecord, BreakRecord

class BreakRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakRecord
        fields = ['id', 'break_start', 'break_end', 'break_seconds']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    breaks = BreakRecordSerializer(many=True, read_only=True)
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    department_name = serializers.SerializerMethodField()

    def get_department_name(self, obj):
        return None

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'user', 'user_name', 'department_name', 'date',
            'check_in', 'check_out', 'status', 'check_in_method', 'check_out_method',
            'late_seconds', 'net_seconds', 'overtime_seconds',
            'night_seconds', 'breaks'
        ]
        read_only_fields = ['id', 'user', 'date', 'late_seconds', 'net_seconds', 'overtime_seconds', 'night_seconds']

class CheckInSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=AttendanceRecord.METHOD_CHOICES, default='manual')

class BulkAbsentSerializer(serializers.Serializer):
    date = serializers.DateField()
