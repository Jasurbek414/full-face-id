from .models import RolePermission

class PermissionService:
    @staticmethod
    def check(user, permission_code):
        """Check if user has a specific permission code.
        Returns scope (OWN, DEPT, ALL) if permitted, else None.
        """
        if user.is_superuser:
            return 'ALL'
            
        if not user.role:
            return None
            
        # Check explicit permissions assigned to the role
        try:
            role_perm = RolePermission.objects.get(
                role=user.role,
                permission__code=permission_code
            )
            return role_perm.scope
        except RolePermission.DoesNotExist:
            return None

    @staticmethod
    def get_user_permissions(user):
        """Return all permission codes for the user."""
        if user.is_superuser:
            from .models import Permission
            return {p.code: 'ALL' for p in Permission.objects.all()}
            
        if not user.role:
            return {}
            
        return {
            rp.permission.code: rp.scope 
            for rp in user.role.permissions.select_related('permission').all()
        }

    @staticmethod
    def sync_system_roles(company):
        """Create or update system roles for a company based on mapping."""
        from .models import CustomRole, Permission, RolePermission
        from .constants import SYSTEM_ROLE_PERMISSION_MAP

        for role_name, perm_codes in SYSTEM_ROLE_PERMISSION_MAP.items():
            role, created = CustomRole.objects.get_or_create(
                company=company,
                name=role_name,
                defaults={'is_system': True, 'hierarchy_level': 0}
            )
            
            # Clear existing perms if we want to reset, or just append
            # For system roles, we usually want to sync exactly
            RolePermission.objects.filter(role=role).delete()
            
            if '*' in perm_codes:
                all_perms = Permission.objects.all()
                RolePermission.objects.bulk_create([
                    RolePermission(role=role, permission=p, scope='ALL')
                    for p in all_perms
                ])
                continue

            # Load specific perms
            perms = Permission.objects.filter(code__in=perm_codes)
            RolePermission.objects.bulk_create([
                RolePermission(role=role, permission=p, scope='ALL') # Default to ALL scope for these codes
                for p in perms
            ])
