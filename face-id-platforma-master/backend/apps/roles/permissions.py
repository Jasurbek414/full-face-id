from rest_framework import permissions
from .services import PermissionService

class HasPermission(permissions.BasePermission):
    """
    Standard DRF permission class. 
    View can specify 'required_permission'.
    Or use factory: HasPermission.for_code('code')
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        code = getattr(view, 'required_permission', None)
        if not code:
            return True
            
        scope = PermissionService.check(request.user, code)
        if scope:
            request.permission_scope = scope
            return True
        return False

    @staticmethod
    def for_code(code):
        class DynamicPermission(HasPermission):
            def has_permission(self, req, view):
                if not req.user or not req.user.is_authenticated:
                    return False
                scope = PermissionService.check(req.user, code)
                if scope:
                    req.permission_scope = scope
                    return True
                return False
        return DynamicPermission
