from rest_framework import serializers
from .models import LeaveType, LeaveRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'max_days_per_year', 'is_paid']

class LeaveRequestSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'leave_type', 'leave_type_name', 'user', 'user_full_name',
            'start_date', 'end_date', 'days', 'reason', 'status',
            'approved_by', 'approved_by_name', 'created_at'
        ]
        read_only_fields = ['status', 'approved_by', 'user', 'company']

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data

class LeaveBalanceSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    max_days_per_year = serializers.IntegerField()
    used_days = serializers.IntegerField()
    remaining_days = serializers.IntegerField()
