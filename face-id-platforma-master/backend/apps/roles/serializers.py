from rest_framework import serializers
from .models import Permission, CustomRole, RolePermission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'code', 'name', 'module')

class RolePermissionSerializer(serializers.ModelSerializer):
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    permission_name = serializers.CharField(source='permission.name', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ('id', 'permission', 'permission_code', 'permission_name', 'scope')

class CustomRoleSerializer(serializers.ModelSerializer):
    permissions = RolePermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = CustomRole
        fields = ('id', 'company', 'name', 'hierarchy_level', 'is_system', 'permissions', 'created_at', 'updated_at')
        read_only_fields = ('id', 'company', 'is_system', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['company'] = request.company
        return super().create(validated_data)
