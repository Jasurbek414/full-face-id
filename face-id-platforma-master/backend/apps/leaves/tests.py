import pytest
from django.urls import reverse
from rest_framework import status
from apps.leaves.models import LeaveType, LeaveRequest
from apps.companies.models import Company

@pytest.fixture
def company(db):
    return Company.objects.create(name="Test Company")

@pytest.mark.django_db
class TestLeaves:
    def test_leave_request_creation(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()

        lt = LeaveType.objects.create(company=company, name="Sick Leave", max_days_per_year=10)
        
        url = reverse('leave-request-list')
        data = {
            'leave_type': lt.id,
            'start_date': '2026-03-10',
            'end_date': '2026-03-12',
            'days': 3,
            'reason': 'Feeling sick'
        }
        response = client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert LeaveRequest.objects.filter(user=user).count() == 1

    def test_approve_leave(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()

        lt = LeaveType.objects.create(company=company, name="Holiday", max_days_per_year=15)
        lr = LeaveRequest.objects.create(
            company=company, user=user, leave_type=lt, 
            start_date='2026-03-10', end_date='2026-03-12', days=3
        )

        url = reverse('leave-request-approve', kwargs={'pk': lr.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        lr.refresh_from_db()
        assert lr.status == 'approved'

    def test_leave_balance(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()

        lt = LeaveType.objects.create(company=company, name="Paid", max_days_per_year=20)
        LeaveRequest.objects.create(
            company=company, user=user, leave_type=lt, 
            start_date='2026-03-01', end_date='2026-03-05', days=5, status='approved'
        )

        url = reverse('leave-request-balance')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Check matching balance entry
        paid_balance = next(item for item in response.data if item.get('leave_type_name') == "Paid")
        assert paid_balance['used_days'] == 5
        assert paid_balance['remaining_days'] == 15

    def test_reject_leave(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        lt = LeaveType.objects.create(company=company, name="Sick", max_days_per_year=10)
        lr = LeaveRequest.objects.create(company=company, user=user, leave_type=lt, start_date='2026-03-10', end_date='2026-03-12', days=3)
        url = reverse('leave-request-reject', kwargs={'pk': lr.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        lr.refresh_from_db()
        assert lr.status == 'rejected'

    def test_my_leaves(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        lt = LeaveType.objects.create(company=company, name="Sick", max_days_per_year=10)
        LeaveRequest.objects.create(company=company, user=user, leave_type=lt, start_date='2026-03-10', end_date='2026-03-12', days=3)
        
        url = reverse('leave-request-my')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_approve_permission_error(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = False
        user.save()
        user.refresh_from_db()
        print(f"DEBUG TEST: User={user.id}, is_staff={user.is_staff}")
        lt = LeaveType.objects.create(company=company, name="Sick", max_days_per_year=10)
        lr = LeaveRequest.objects.create(company=company, user=user, leave_type=lt, start_date='2026-03-10', end_date='2026-03-12', days=3)
        url = reverse('leave-request-approve', kwargs={'pk': lr.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
