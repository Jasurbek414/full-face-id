from rest_framework import serializers
from .models import FaceAttempt

class FaceAttemptSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='device.name', read_only=True)
    employee_name = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = FaceAttempt
        fields = [
            'id', 'device_name', 'employee_name', 
            'success', 'distance', 'timestamp'
        ]

    def get_employee_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.phone
        return "Unknown"
