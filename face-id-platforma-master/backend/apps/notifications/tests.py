import pytest
from django.urls import reverse
from rest_framework import status
from apps.notifications.models import Notification, NotificationPreference
from apps.companies.models import Company

@pytest.fixture
def company(db):
    return Company.objects.create(name="Test Company")

@pytest.mark.django_db
class TestNotifications:
    def test_list_notifications(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        
        Notification.objects.create(
            company=company, user=user, title="Test", message="Msg"
        )
        url = reverse('notification-list')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Check standard list response (might be paginated)
        if 'results' in response.data:
            assert len(response.data['results']) == 1
        else:
            assert len(response.data) == 1

    def test_unread_count(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        
        Notification.objects.create(company=company, user=user, title="Test1", message="Msg1", is_read=False)
        Notification.objects.create(company=company, user=user, title="Test2", message="Msg2", is_read=True)
        
        url = reverse('notification-unread-count')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 1

    def test_read_notification(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        
        n = Notification.objects.create(
            company=company, user=user, title="Test", message="Msg"
        )
        url = reverse('notification-read', kwargs={'pk': n.pk})
        # Support both post and patch
        response = client.patch(url)
        if response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        n.refresh_from_db()
        assert n.is_read is True

    def test_read_all_notifications(self, auth_client, company):
        client, user, tokens = auth_client
        user.company = company
        user.save()
        
        Notification.objects.create(company=company, user=user, title="T1", message="M1")
        Notification.objects.create(company=company, user=user, title="T2", message="M2")
        url = reverse('notification-read-all')
        response = client.post(url)
        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.filter(user=user, is_read=False).count() == 0

    def test_get_preferences(self, auth_client):
        client, user, tokens = auth_client
        url = reverse('preferences')
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'push_enabled' in response.data
        assert response.data['push_enabled'] is True  # Default is True

    def test_update_preferences(self, auth_client):
        client, user, tokens = auth_client
        url = reverse('preferences')
        data = {'push_enabled': False, 'sms_enabled': True}
        response = client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        pref = NotificationPreference.objects.get(user=user)
        assert pref.push_enabled is False
        assert pref.sms_enabled is True

@pytest.mark.django_db
class TestNotificationTasks:
    def test_send_late_notification(self, auth_client, company):
        client, user, tokens = auth_client
        from apps.attendance.models import AttendanceRecord
        from apps.notifications.tasks import send_late_notification
        from django.utils import timezone
        
        user.company = company
        user.save()
        
        record = AttendanceRecord.objects.create(
            user=user, company=company, date=timezone.now().date(),
            check_in=timezone.now(), status='late', late_seconds=600
        )
        
        result = send_late_notification(record.id)
        assert result is True
        assert Notification.objects.filter(user=user, notification_type='attendance_late').exists()

    def test_check_absent_employees(self, auth_client, company):
        client, user, tokens = auth_client
        from apps.notifications.tasks import check_absent_employees
        from apps.schedules.models import UserSchedule, WorkSchedule
        from django.utils import timezone
        import datetime
        
        user.company = company
        user.save()

        # Create a WorkSchedule
        work_sched = WorkSchedule.objects.create(
            company=company,
            name="9-6 Office",
            work_start=datetime.time(9, 0),
            work_end=datetime.time(18, 0),
            late_tolerance_min=15
        )
        
        # Create a UserSchedule linked to WorkSchedule
        UserSchedule.objects.create(
            user=user, company=company,
            schedule=work_sched,
            effective_from=timezone.now().date()
        )
        
        # No attendance record exists
        result = check_absent_employees()
        assert result is True
        assert Notification.objects.filter(user=user, notification_type='attendance_absent').exists()
