import pytest
from django.urls import reverse
from rest_framework import status
from apps.companies.models import Company, Department, Branch

@pytest.mark.django_db
class TestCompaniesAPI:
    def test_create_department(self, auth_client):
        client, user, tokens = auth_client
        company = Company.objects.create(name='Test Co')
        user.company = company
        user.save()
        
        url = reverse('department-list')
        data = {'name': 'HR'}
        
        # Test middleware and creation
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}", HTTP_X_COMPANY_ID=str(company.id))
        response = client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Department.objects.filter(name='HR', company=company).exists()

    def test_list_branches(self, auth_client):
        client, user, tokens = auth_client
        company = Company.objects.create(name='Test Co')
        user.company = company
        user.save()
        Branch.objects.create(company=company, name='Main Branch', latitude=41.2995, longitude=69.2401)
        
        url = reverse('branch-list')
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}", HTTP_X_COMPANY_ID=str(company.id))
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Main Branch'

    def test_invalid_company_id(self, auth_client):
        client, user, tokens = auth_client
        url = reverse('branch-list')
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}", HTTP_X_COMPANY_ID='invalid-uuid')
        response = client.get(url)
        # Should be handled by TenantMiddleware or DRF
        assert response.status_code == status.HTTP_403_FORBIDDEN
