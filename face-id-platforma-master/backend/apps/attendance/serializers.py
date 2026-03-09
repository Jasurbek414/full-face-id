from rest_framework import serializers
from .models import AttendanceRecord, BreakRecord

class BreakRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakRecord
        fields = ['id', 'break_start', 'break_end', 'break_seconds']

class AttendanceRecordSerializer(serializers.ModelSerializer):
    breaks = BreakRecordSerializer(many=True, read_only=True)
    user_name = serializers.ReadOnlyField(source='user.get_full_name')
    user_photo = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()

    def get_user_photo(self, obj):
        if not obj.user.photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.user.photo.url)
        return obj.user.photo.url

    def get_department_name(self, obj):
        dept = getattr(obj.user, 'department', None)
        return dept.name if dept else None

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'user', 'user_name', 'user_photo', 'department_name', 'date',
            'check_in', 'check_out', 'status', 'check_in_method', 'check_out_method',
            'late_seconds', 'net_seconds', 'overtime_seconds',
            'night_seconds', 'breaks'
        ]
        read_only_fields = ['id', 'user', 'date', 'late_seconds', 'net_seconds', 'overtime_seconds', 'night_seconds']

class CheckInSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=AttendanceRecord.METHOD_CHOICES, default='manual')

class ManualAttendanceUpdateSerializer(serializers.Serializer):
    check_in = serializers.TimeField(required=False)
    check_out = serializers.TimeField(required=False, allow_null=True)
    check_in_method = serializers.ChoiceField(choices=AttendanceRecord.METHOD_CHOICES, required=False)
    status = serializers.ChoiceField(choices=AttendanceRecord.STATUS_CHOICES, required=False)

class ManualAttendanceCreateSerializer(serializers.Serializer):
    user = serializers.UUIDField()
    date = serializers.DateField()
    check_in = serializers.TimeField()
    check_out = serializers.TimeField(required=False, allow_null=True)
    check_in_method = serializers.ChoiceField(
        choices=AttendanceRecord.METHOD_CHOICES, default='manual'
    )

class BulkAbsentSerializer(serializers.Serializer):
    date = serializers.DateField()
