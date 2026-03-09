import pytest
from datetime import time, date, timedelta, datetime
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient

from apps.companies.models import Company
from apps.accounts.models import User
from apps.schedules.models import WorkSchedule, UserSchedule
from apps.attendance.models import AttendanceRecord, BreakRecord
from apps.attendance.services import determine_attendance_status, calculate_net_seconds

@pytest.fixture
def test_setup(db):
    company = Company.objects.create(name="Test Co", timezone="Asia/Tashkent")
    user = User.objects.create_user(phone="998901234567", password="password123", company=company)
    
    schedule = WorkSchedule.objects.create(company=company, name="Standard", work_start=time(9, 0), work_end=time(18, 0), late_tolerance_min=15)
    UserSchedule.objects.create(user=user, company=company, schedule=schedule, effective_from=date.today())
    
    return company, user

@pytest.mark.django_db
class TestAttendanceServices:
    def test_determine_status_on_time(self, test_setup):
        company, user = test_setup
        tz = ZoneInfo(company.timezone)
        # 08:50 AM local time
        check_in_time = datetime.combine(date.today(), time(8, 50), tzinfo=tz)
        status, late_secs = determine_attendance_status(user, check_in_time)
        assert status == 'on_time'
        assert late_secs == 0
        
    def test_determine_status_late(self, test_setup):
        company, user = test_setup
        tz = ZoneInfo(company.timezone)
        # 09:20 AM local time
        check_in_time = datetime.combine(date.today(), time(9, 20), tzinfo=tz)
        status, late_secs = determine_attendance_status(user, check_in_time)
        assert status == 'late'
        assert late_secs == 300  # 20 mins - 15 mins tolerance = 5 mins = 300 seconds

    def test_determine_status_no_schedule(self, test_setup):
        company, user = test_setup
        UserSchedule.objects.all().delete()
        check_in_time = timezone.now()
        status, late_secs = determine_attendance_status(user, check_in_time)
        assert status == 'on_time'
        assert late_secs == 0

    def test_calculate_net_seconds(self):
        check_in = timezone.now() - timedelta(hours=9)
        check_out = timezone.now()
        class DummyBreak:
            break_seconds = 3600
        breaks = [DummyBreak()]
        
        net = calculate_net_seconds(check_in, check_out, breaks)
        assert net == (9 * 3600) - 3600

    def test_calculate_net_seconds_none(self):
        assert calculate_net_seconds(timezone.now(), None, []) == 0

class AttendanceAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(name="Test Co", timezone="Asia/Tashkent")
        self.user = User.objects.create_user(phone="998901112233", password="password123", company=self.company)
        self.client.force_authenticate(user=self.user)
        
        schedule = WorkSchedule.objects.create(company=self.company, name="Standard", work_start=time(9, 0), work_end=time(18, 0))
        UserSchedule.objects.create(user=self.user, company=self.company, schedule=schedule, effective_from=date.today())

    def test_check_in_api(self):
        url = reverse('attendance-check-in')
        response = self.client.post(url, {'method': 'qr'})
        assert response.status_code == 201
        assert response.data['status'] in ['on_time', 'late']
        
        # Second check-in fails
        response2 = self.client.post(url, {})
        assert response2.status_code == 400
        assert AttendanceRecord.objects.count() == 1

    def test_check_in_with_existing_absent_record(self):
        AttendanceRecord.objects.create(user=self.user, company=self.company, date=timezone.now().date(), status='absent')
        url = reverse('attendance-check-in')
        response = self.client.post(url, {'method': 'qr'})
        assert response.status_code == 201

    def test_check_out_api(self):
        # Create check-in first
        AttendanceRecord.objects.create(user=self.user, company=self.company, date=timezone.now().date(), check_in=timezone.now() - timedelta(hours=4))
        
        url = reverse('attendance-check-out')
        response = self.client.post(url)
        assert response.status_code == 200
        assert response.data['net_seconds'] > 0
        
        # Check out again
        response2 = self.client.post(url)
        assert response2.status_code == 400

    def test_check_out_no_checkin(self):
        url = reverse('attendance-check-out')
        assert self.client.post(url).status_code == 400

    def test_check_out_with_active_break(self):
        rec = AttendanceRecord.objects.create(user=self.user, company=self.company, date=timezone.now().date(), check_in=timezone.now() - timedelta(hours=4))
        BreakRecord.objects.create(attendance=rec, break_start=timezone.now() - timedelta(hours=1))
        url = reverse('attendance-check-out')
        assert self.client.post(url).status_code == 200

    def test_break_api(self):
        # Must check in first
        AttendanceRecord.objects.create(user=self.user, company=self.company, date=timezone.now().date(), check_in=timezone.now() - timedelta(hours=2))
        
        url_start = reverse('attendance-break-start')
        resp = self.client.post(url_start)
        assert resp.status_code == 200
        
        # Start break again
        assert self.client.post(url_start).status_code == 400
        
        url_end = reverse('attendance-break-end')
        resp = self.client.post(url_end)
        assert resp.status_code == 200
        
        # End break again
        assert self.client.post(url_end).status_code == 400
        
        record = AttendanceRecord.objects.get(user=self.user, date=timezone.now().date())
        assert record.breaks.count() == 1
        assert record.breaks.first().break_seconds >= 0

    def test_break_api_invalid(self):
        assert self.client.post(reverse('attendance-break-start')).status_code == 400
        assert self.client.post(reverse('attendance-break-end')).status_code == 400

    def test_today_and_live_api(self):
        AttendanceRecord.objects.create(user=self.user, company=self.company, date=timezone.now().date(), check_in=timezone.now())
        
        url_today = reverse('attendance-today')
        resp = self.client.get(url_today)
        assert resp.status_code == 200
        
        url_live = reverse('attendance-live')
        resp = self.client.get(url_live)
        assert resp.status_code == 200
        assert resp.data['count'] == 1

    def test_today_no_record(self):
        assert self.client.get(reverse('attendance-today')).status_code == 404

    def test_get_queryset_filters(self):
        url = reverse('attendance-list')
        resp = self.client.get(url, {'date_from': '2020-01-01', 'date_to': '2030-01-01', 'status': 'on_time'})
        assert resp.status_code == 200

    def test_summary_api(self):
        url = reverse('attendance-summary')
        resp = self.client.get(url, {'month': timezone.now().month, 'year': timezone.now().year})
        assert resp.status_code == 200
        assert 'present_days' in resp.data

    def test_summary_no_params(self):
        assert self.client.get(reverse('attendance-summary')).status_code == 400

    def test_company_stats_api(self):
        AttendanceRecord.objects.create(user=self.user, company=self.company, date=timezone.now().date(), check_in=timezone.now(), status='on_time')
        
        url = reverse('company-stats')
        resp = self.client.get(url)
        assert resp.status_code == 200
        assert resp.data['present_today'] == 1
        assert resp.data['total_employees'] == 1
        assert resp.data['attendance_rate'] == 100.0

    def test_bulk_absent_api(self):
        url = reverse('attendance-bulk-absent')
        resp = self.client.post(url, {'date': timezone.now().date().isoformat()})
        assert resp.status_code == 200
        
        assert AttendanceRecord.objects.filter(user=self.user, date=timezone.now().date(), status='absent').exists()
