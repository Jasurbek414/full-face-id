import pytest
from datetime import time, date, timedelta
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from apps.companies.models import Company
from apps.accounts.models import User
from apps.schedules.models import WorkSchedule, UserSchedule, ShiftTemplate
from apps.schedules.services import get_company_now, get_user_schedule

@pytest.fixture
def company(db):
    return Company.objects.create(name="Test Company", timezone="Asia/Tashkent")

@pytest.fixture
def user(db, company):
    return User.objects.create_user(phone="998901234567", password="password123", company=company)

@pytest.mark.django_db
class TestSchedules:
    def test_create_work_schedule(self, company):
        schedule = WorkSchedule.objects.create(
            company=company,
            name="Normal Shift",
            work_start=time(9, 0),
            work_end=time(18, 0)
        )
        assert schedule.name == "Normal Shift"
        assert str(schedule) == f"{company.name} - Normal Shift"

    def test_assign_user_schedule(self, user, company):
        schedule = WorkSchedule.objects.create(
            company=company,
            name="Normal Shift",
            work_start=time(9, 0),
            work_end=time(18, 0)
        )
        user_schedule = UserSchedule.objects.create(
            user=user,
            company=company,
            schedule=schedule,
            effective_from=date.today()
        )
        assert user_schedule.user == user
        assert user_schedule.schedule == schedule

    def test_get_user_schedule_service(self, user, company):
        schedule = WorkSchedule.objects.create(
            company=company,
            name="Normal Shift",
            work_start=time(9, 0),
            work_end=time(18, 0)
        )
        today = date.today()
        UserSchedule.objects.create(
            user=user,
            company=company,
            schedule=schedule,
            effective_from=today - timedelta(days=1),
            effective_to=today + timedelta(days=1)
        )
        
        found_schedule = get_user_schedule(user, today)
        assert found_schedule == schedule
        
        # Test out of range
        assert get_user_schedule(user, today + timedelta(days=5)) is None

    def test_get_company_now_timezone(self, company):
        now_tashkent = get_company_now(company)
        assert str(now_tashkent.tzinfo) == "Asia/Tashkent"
        
        # Change timezone
        company.timezone = "UTC"
        company.save()
        now_utc = get_company_now(company)
        assert str(now_utc.tzinfo) == "UTC"

    def test_shift_template(self, company):
        schedule = WorkSchedule.objects.create(
            company=company,
            name="Normal Shift",
            work_start=time(9, 0),
            work_end=time(18, 0)
        )
        template = ShiftTemplate.objects.create(
            company=company,
            name="Weekday Template",
            days=[1, 2, 3, 4, 5],
            schedule=schedule
        )
        assert template.days == [1, 2, 3, 4, 5]

class ScheduleAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(name="Test Co", timezone="Asia/Tashkent")
        self.user = User.objects.create_user(phone="998901112233", password="password123", company=self.company)
        self.client.force_authenticate(user=self.user)
        self.schedule = WorkSchedule.objects.create(
            company=self.company,
            name="9-to-6",
            work_start=time(9, 0),
            work_end=time(18, 0)
        )

    def test_list_schedules(self):
        url = reverse('work-schedule-list')
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_assign_schedule_api(self):
        url = reverse('work-schedule-assign', kwargs={'pk': self.schedule.pk})
        data = {
            'user_id': self.user.id,
            'effective_from': date.today().isoformat()
        }
        response = self.client.post(url, data)
        assert response.status_code == 201
        assert response.data['schedule_name'] == "9-to-6"

    def test_my_schedule_api(self):
        # First assign
        UserSchedule.objects.create(
            user=self.user,
            company=self.company,
            schedule=self.schedule,
            effective_from=date.today()
        )
        url = reverse('work-schedule-my')
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data['name'] == "9-to-6"

    def test_my_schedule_api_not_found(self):
        url = reverse('work-schedule-my')
        response = self.client.get(url)
        assert response.status_code == 404

    def test_str_methods(self):
        assert str(self.schedule) == f"{self.company.name} - 9-to-6"
        template = ShiftTemplate.objects.create(
            company=self.company,
            name="Weekdays",
            days=[1, 2, 3, 4, 5],
            schedule=self.schedule
        )
        assert str(template) == f"{self.company.name} - Weekdays"
        us = UserSchedule.objects.create(
            user=self.user,
            company=self.company,
            schedule=self.schedule,
            effective_from=date.today()
        )
        assert str(us) == f"{self.user.phone} - 9-to-6"

    def test_assign_schedule_missing_fields(self):
        url = reverse('work-schedule-assign', kwargs={'pk': self.schedule.pk})
        response = self.client.post(url, {})  # Missing fields
        assert response.status_code == 400

    def test_shift_template_api(self):
        url = reverse('shift-template-list')
        # Create
        response = self.client.post(url, {
            'name': 'API Template',
            'days': [1, 2],
            'schedule': self.schedule.id
        })
        assert response.status_code == 201
        
        # List
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_create_work_schedule_api(self):
        url = reverse('work-schedule-list')
        data = {
            'name': 'New API Schedule',
            'work_start': '10:00:00',
            'work_end': '19:00:00'
        }
        response = self.client.post(url, data)
        assert response.status_code == 201
        assert WorkSchedule.objects.filter(name='New API Schedule').exists()
