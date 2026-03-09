import pytest
from django.urls import reverse
from rest_framework import status
from datetime import date, datetime
from apps.companies.models import Company
from apps.attendance.models import AttendanceRecord

@pytest.fixture
def company(db):
    return Company.objects.create(name="Analytics Corp")

@pytest.mark.django_db
class TestReports:
    def test_daily_report(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        
        AttendanceRecord.objects.create(
            user=user, company=company, date=date.today(),
            status='on_time', check_in=datetime.now(),
            net_seconds=8 * 3600
        )
        
        url = reverse('report-daily')
        response = client.get(url, {'date': str(date.today())})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        record = [r for r in response.data if r['user_id'] == str(user.id)][0]
        assert record['status'] == 'on_time'
        assert record['net_hours'] == 8.0

    def test_monthly_report(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        
        AttendanceRecord.objects.create(
            user=user, company=company, date=date(2026, 3, 1),
            status='on_time', net_seconds=8 * 3600
        )
        AttendanceRecord.objects.create(
            user=user, company=company, date=date(2026, 3, 2),
            status='late', late_seconds=1800, net_seconds=7.5 * 3600
        )
        
        url = reverse('report-monthly')
        response = client.get(url, {'month': '2026-03'})
        assert response.status_code == status.HTTP_200_OK
        data = response.data[0]
        assert data['present_days'] == 2
        assert data['late_days'] == 1

    def test_summary_report(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        
        url = reverse('report-summary')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total_employees' in response.data

    def test_late_analysis(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        
        AttendanceRecord.objects.create(
            user=user, company=company, date=date(2026, 3, 1),
            status='late', late_seconds=1800
        )
        
        url = reverse('report-late-analysis')
        response = client.get(url, {'month': '2026-03'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        record = [r for r in response.data if r['user_id'] == str(user.id)][0]
        assert record['late_count'] == 1

    def test_export_csv(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        
        url = reverse('report-export')
        print(f"\n\n--- DEBUG ---\nURL is: {url}")
        
        response = client.get(url, {'type': 'daily', 'export_format': 'csv', 'date': str(date.today())})
        print(f"DEBUG EXPORT CSV: {response.status_code} {response.content}")
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'text/csv'
        assert b'user_name' in response.content

    def test_export_json(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.is_staff = True
        user.save()
        
        url = reverse('report-export')
        response = client.get(url, {'type': 'monthly', 'export_format': 'json', 'month': '2026-03'})
        assert response.status_code == status.HTTP_200_OK
        assert response['Content-Type'] == 'application/json'
        
    def test_daily_invalid_date(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        url = reverse('report-daily')
        response = client.get(url, {'date': 'invalid'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
