from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel
from apps.companies.models import Company

class WorkSchedule(SoftDeleteModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='schedules')
    name = models.CharField(max_length=255)
    work_start = models.TimeField()
    work_end = models.TimeField()
    late_tolerance_min = models.PositiveIntegerField(default=15)
    overtime_threshold_min = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.company.name} - {self.name}"

class ShiftTemplate(SoftDeleteModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='shift_templates')
    name = models.CharField(max_length=255)
    days = models.JSONField()  # Store list of day integers (0-6 or 1-7)
    schedule = models.ForeignKey(WorkSchedule, on_delete=models.CASCADE, related_name='templates')

    def __str__(self):
        return f"{self.company.name} - {self.name}"

class UserSchedule(SoftDeleteModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schedules')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='user_schedules')
    schedule = models.ForeignKey(WorkSchedule, on_delete=models.CASCADE, related_name='user_assignments')
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.phone} - {self.schedule.name}"
