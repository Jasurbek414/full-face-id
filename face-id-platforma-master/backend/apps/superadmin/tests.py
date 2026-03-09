import pytest
from django.urls import reverse
from rest_framework import status
from apps.companies.models import Company
from apps.superadmin.models import SuperAdminActionLog
from apps.superadmin.views_auth import SAToken

@pytest.mark.django_db
class TestSuperAdmin:
    def test_sa_login_and_auth(self, admin_user):
        url = reverse('sa-login')
        data = {'phone': admin_user.phone, 'password': 'password123'}
        admin_user.set_password('password123')
        admin_user.save()
        
        response = admin_user.api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        token = response.data['access']
        
        # Test dashboard with this token
        dash_url = reverse('sa-dashboard')
        admin_user.api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = admin_user.api_client.get(dash_url)
        assert response.status_code == status.HTTP_200_OK

    def test_company_management_and_logging(self, admin_user):
        company = Company.objects.create(name='Target Co', is_active=True)
        token = SAToken.for_user(admin_user).sign()
        admin_user.api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        # Block company
        url = reverse('sa-companies-block', kwargs={'pk': company.pk})
        response = admin_user.api_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        
        company.refresh_from_db()
        assert not company.is_active
        
        # Check log
        assert SuperAdminActionLog.objects.filter(target_company=company, action='block').exists()

    def test_dashboard_stats(self, admin_user):
        Company.objects.create(name='Co 1', is_active=True)
        Company.objects.create(name='Co 2', is_active=False)
        
        token = SAToken.for_user(admin_user).sign()
        admin_user.api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        url = reverse('sa-dashboard')
        response = admin_user.api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['companies']['total'] >= 2
        assert response.data['system']['db'] == 'up'

    def test_audit_log_view(self, admin_user):
        token = SAToken.for_user(admin_user).sign()
        admin_user.api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        url = reverse('sa-audit-log')
        response = admin_user.api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

@pytest.fixture
def admin_user(db):
    from apps.accounts.models import User
    from rest_framework.test import APIClient
    user = User.objects.create_superuser(phone='+998901234567', password='password123')
    user.api_client = APIClient()
    return user
