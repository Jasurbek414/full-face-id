from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPES = (
        ('attendance_late', 'Attendance Late'),
        ('attendance_absent', 'Attendance Absent'),
        ('leave_request', 'Leave Request'),
        ('subscription_warning', 'Subscription Warning'),
        ('subscription_blocked', 'Subscription Blocked'),
        ('device_offline', 'Device Offline'),
        ('general', 'General'),
    )

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='notifications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=TYPES, default='general')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type}: {self.title} to {self.user.get_full_name()}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    push_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)

    def __str__(self):
        return f"Preferences for {self.user.get_full_name()}"
