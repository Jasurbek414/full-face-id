from datetime import date
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from apps.accounts.models import User
from apps.companies.models import Company
from apps.roles.models import CustomRole
from apps.schedules.models import WorkSchedule
from apps.attendance.models import AttendanceRecord
from django.utils import timezone


class EmployeeSetup(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.company = Company.objects.create(name="Test Corp", timezone="Asia/Tashkent")
        self.admin = User.objects.create_user(
            phone="998900000001", password="pass123", company=self.company, is_staff=True
        )
        self.client.force_authenticate(user=self.admin)


class EmployeeListCreateTests(EmployeeSetup):
    def test_list_employees(self):
        User.objects.create_user(phone="998900000002", password="p", company=self.company)
        url = reverse('employee-list')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # Should include admin + new employee (both in same company)
        self.assertGreaterEqual(len(resp.data['results'] if 'results' in resp.data else resp.data), 1)

    def test_create_employee(self):
        url = reverse('employee-list')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'phone': '998900000099',
            'password': 'securepass123',
        }
        resp = self.client.post(url, data)
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(User.objects.filter(phone='998900000099').exists())

    def test_tenant_isolation(self):
        """Employees from another company should not be visible"""
        other_company = Company.objects.create(name="Other Corp", timezone="Asia/Tashkent")
        User.objects.create_user(phone="998911111111", password="p", company=other_company)
        url = reverse('employee-list')
        resp = self.client.get(url)
        phones = [emp['phone'] for emp in (resp.data['results'] if 'results' in resp.data else resp.data)]
        self.assertNotIn('998911111111', phones)

    def test_deactivate_employee(self):
        emp = User.objects.create_user(phone="998900000003", password="p", company=self.company)
        url = reverse('employee-deactivate', args=[emp.pk])
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 200)
        emp.refresh_from_db()
        self.assertFalse(emp.is_active)


class EmployeeRoleScheduleTests(EmployeeSetup):
    def setUp(self):
        super().setUp()
        self.employee = User.objects.create_user(
            phone="998900000010", password="p", company=self.company
        )
        self.role = CustomRole.objects.create(company=self.company, name="Developer")
        from datetime import time
        self.schedule = WorkSchedule.objects.create(
            company=self.company, name="Morning",
            work_start=time(9, 0), work_end=time(18, 0)
        )

    def test_assign_role(self):
        url = reverse('employee-assign-role', args=[self.employee.pk])
        resp = self.client.post(url, {'role_id': str(self.role.id)})
        self.assertEqual(resp.status_code, 200)
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.role, self.role)

    def test_assign_role_wrong_company(self):
        other_company = Company.objects.create(name="Other", timezone="UTC")
        bad_role = CustomRole.objects.create(company=other_company, name="Hacker")
        url = reverse('employee-assign-role', args=[self.employee.pk])
        resp = self.client.post(url, {'role_id': str(bad_role.id)})
        self.assertEqual(resp.status_code, 404)

    def test_assign_schedule(self):
        url = reverse('employee-assign-schedule', args=[self.employee.pk])
        resp = self.client.post(url, {
            'schedule_id': str(self.schedule.id),
            'effective_from': date.today().isoformat()
        })
        self.assertEqual(resp.status_code, 200)
        from apps.schedules.services import get_user_schedule
        sched = get_user_schedule(self.employee, date.today())
        self.assertIsNotNone(sched)

    def test_assign_schedule_wrong_company(self):
        other_company = Company.objects.create(name="Other", timezone="UTC")
        from datetime import time
        bad_schedule = WorkSchedule.objects.create(
            company=other_company, name="Bad",
            work_start=time(9, 0), work_end=time(18, 0)
        )
        url = reverse('employee-assign-schedule', args=[self.employee.pk])
        resp = self.client.post(url, {
            'schedule_id': str(bad_schedule.id),
            'effective_from': date.today().isoformat()
        })
        self.assertEqual(resp.status_code, 404)

    def test_employee_attendance_history(self):
        AttendanceRecord.objects.create(
            user=self.employee, company=self.company,
            date=date.today(), check_in=timezone.now(), status='on_time'
        )
        url = reverse('employee-attendance', args=[self.employee.pk])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data['results']), 1)

    def test_employee_serializer_today_status(self):
        url = reverse('employee-detail', args=[self.employee.pk])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('today_status', resp.data)
