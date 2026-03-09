from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Checks if user is authenticated and is a superuser.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_superuser
        )
