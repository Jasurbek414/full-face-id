from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework import exceptions

User = get_user_model()

class SALoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(phone=attrs['phone'], password=attrs['password'])
        if not user:
            raise exceptions.AuthenticationFailed('Invalid credentials')
        if not user.is_superuser:
            raise exceptions.AuthenticationFailed('Not a SuperAdmin')
        attrs['user'] = user
        return attrs
