import pytest
from django.urls import reverse
from rest_framework import status
from apps.roles.models import Permission, CustomRole, RolePermission
from apps.roles.services import PermissionService
from apps.companies.models import Company

@pytest.mark.django_db
class TestRolesRBAC:
    def test_sync_system_roles(self):
        company = Company.objects.create(name='Test Co')
        PermissionService.sync_system_roles(company)
        
        roles = CustomRole.objects.filter(company=company)
        assert roles.count() == 7 # OWNER, ADMIN, MANAGER, HR, ACCOUNTANT, EMPLOYEE, GUARD
        
        owner_role = roles.get(name='OWNER')
        assert owner_role.permissions.count() == 30 # All 30 perms
        
        guard_role = roles.get(name='GUARD')
        # GUARD has attendance.live_view and attendance.view_all
        assert guard_role.permissions.filter(permission__code='attendance.live_view').exists()
        assert guard_role.permissions.filter(permission__code='attendance.view_all').exists()

    def test_permission_service_check(self, auth_client):
        client, user, tokens = auth_client
        company = Company.objects.create(name='Test Co')
        user.company = company
        
        PermissionService.sync_system_roles(company)
        user.role = CustomRole.objects.get(company=company, name='EMPLOYEE')
        user.save()
        
        # EMPLOYEE has attendance.view_own
        assert PermissionService.check(user, 'attendance.view_own') == 'ALL'
        # EMPLOYEE doesn't have settings.company
        assert PermissionService.check(user, 'settings.company') is None

    def test_drf_permission_class(self, auth_client):
        client, user, tokens = auth_client
        company = Company.objects.create(name='Test Co')
        user.company = company
        PermissionService.sync_system_roles(company)
        
        # Case 1: No role
        user.role = None
        user.save()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}", HTTP_X_COMPANY_ID=str(company.id))
        
        url = reverse('custom-role-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Case 2: OWNER role (has everything)
        user.role = CustomRole.objects.get(company=company, name='OWNER')
        user.save()
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_create_custom_role(self, auth_client):
        client, user, tokens = auth_client
        company = Company.objects.create(name='Test Co')
        user.company = company
        PermissionService.sync_system_roles(company)
        user.role = CustomRole.objects.get(company=company, name='OWNER')
        user.save()
        
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}", HTTP_X_COMPANY_ID=str(company.id))
        url = reverse('custom-role-list')
        data = {'name': 'Custom Senior Manager', 'hierarchy_level': 10}
        
        response = client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert CustomRole.objects.filter(name='Custom Senior Manager', company=company).exists()

    def test_assign_permissions_to_role(self, auth_client):
        client, user, tokens = auth_client
        company = Company.objects.create(name='Test Co')
        user.company = company
        PermissionService.sync_system_roles(company)
        user.role = CustomRole.objects.get(company=company, name='OWNER')
        user.save()
        
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}", HTTP_X_COMPANY_ID=str(company.id))
        
        role = CustomRole.objects.create(company=company, name='Junior HR')
        perm = Permission.objects.get(code='leaves.request')
        
        url = reverse('custom-role-assign-permissions', kwargs={'pk': role.pk})
        data = {'permissions': [{'permission': perm.id, 'scope': 'OWN'}]}
        
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert RolePermission.objects.filter(role=role, permission=perm, scope='OWN').exists()
