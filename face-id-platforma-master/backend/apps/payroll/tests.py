import pytest
from django.urls import reverse
from rest_framework import status
from datetime import date
from apps.payroll.models import SalaryConfig, PayrollRecord
from apps.companies.models import Company
from apps.attendance.models import AttendanceRecord
from django.utils import timezone

@pytest.fixture
def company(db):
    return Company.objects.create(name="Payroll Corp")

@pytest.mark.django_db
class TestPayroll:
    def test_salary_config(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()

        url = reverse('salary-config-list')
        data = {
            'user': str(user.id),
            'company': str(company.id),
            'salary_type': 'monthly',
            'amount': 5000000
        }
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        config = SalaryConfig.objects.get(user=user)
        assert config.amount == 5000000

    def test_calculate_payroll(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()

        SalaryConfig.objects.create(
            user=user, company=company, salary_type='daily', amount=200000
        )
        
        # Create 5 working days in March 2026
        for i in range(1, 6):
            AttendanceRecord.objects.create(
                user=user, company=company, date=date(2026, 3, i),
                status='on_time', check_in=timezone.now() # dummy check_in
            )

        url = reverse('payroll-calculate')
        response = client.post(url, {'month': '2026-03'})
        assert response.status_code == status.HTTP_200_OK
        
        record = PayrollRecord.objects.get(user=user, month=date(2026, 3, 1))
        # Daily: 5 days * 200,000 = 1,000,000
        assert int(record.net_salary) == 1000000

    def test_calculate_hourly_payroll(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()

        SalaryConfig.objects.create(
            user=user, company=company, salary_type='hourly', amount=50000
        )
        
        # 8 hours worked on March 1st
        AttendanceRecord.objects.create(
            user=user, company=company, date=date(2026, 3, 1),
            status='on_time', check_in=timezone.now(), 
            net_seconds=8 * 3600
        )

        url = reverse('payroll-calculate')
        response = client.post(url, {'month': '2026-03'})
        assert response.status_code == status.HTTP_200_OK
        
        record = PayrollRecord.objects.get(user=user, month=date(2026, 3, 1))
        # Hourly: 8 hours * 50,000 = 400,000
        assert int(record.net_salary) == 400000

    def test_approve_payroll(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        record = PayrollRecord.objects.create(user=user, company=company, month=date(2026, 3, 1), net_salary=1000)
        url = reverse('payroll-approve', kwargs={'pk': record.pk})
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        record.refresh_from_db()
        assert record.status == 'approved'

    def test_my_payrolls(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        PayrollRecord.objects.create(user=user, company=company, month=date(2026, 3, 1), net_salary=1000)
        url = reverse('payroll-my')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
