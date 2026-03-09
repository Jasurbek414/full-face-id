from rest_framework import serializers
from apps.devices.models import Device


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            'id', 'device_type', 'name', 'location',
            'ip_address', 'port', 'mac_address', 'rtsp_url',
            'device_username',
            'face_threshold', 'check_type',
            'connection_status', 'last_ping',
            'is_active', 'api_key', 'created_at',
        ]
        read_only_fields = ['id', 'api_key', 'created_at', 'connection_status', 'last_ping']


class DeviceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            'device_type', 'name', 'location',
            'ip_address', 'port', 'mac_address', 'rtsp_url',
            'device_username', 'device_password',
            'face_threshold', 'check_type',
        ]

    def create(self, validated_data):
        company = self.context['request'].user.company
        return Device.objects.create(company=company, **validated_data)
