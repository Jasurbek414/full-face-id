from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Permission, CustomRole, RolePermission
from .serializers import PermissionSerializer, CustomRoleSerializer
from .permissions import HasPermission

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by('module', 'name')
    serializer_class = PermissionSerializer
    permission_classes = [HasPermission]
    required_permission = 'settings.roles'

class CustomRoleViewSet(viewsets.ModelViewSet):
    serializer_class = CustomRoleSerializer
    permission_classes = [HasPermission]
    required_permission = 'settings.roles'

    def get_queryset(self):
        company = getattr(self.request.user, 'company', None)
        if not company:
            return CustomRole.objects.none()
        return CustomRole.objects.filter(
            company=company,
            is_deleted=False
        ).prefetch_related('permissions__permission')

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions(self, request, pk=None):
        role = self.get_object()
        if role.is_system:
             return Response({"detail": "Cannot modify system roles directly."}, status=status.HTTP_400_BAD_REQUEST)
        
        perms_data = request.data.get('permissions', [])
        # Format: [{"permission": id, "scope": "ALL"}, ...]
        
        RolePermission.objects.filter(role=role).delete()
        
        for p_data in perms_data:
            RolePermission.objects.create(
                role=role,
                permission_id=p_data['permission'],
                scope=p_data.get('scope', 'OWN')
            )
            
        return Response({"status": "permissions assigned"})
