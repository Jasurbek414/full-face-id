import uuid
from django.db import models
from django.conf import settings
from apps.companies.models import Company

class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('on_time', 'On Time'),
        ('late', 'Late'),
        ('early_leave', 'Early Leave'),
        ('absent', 'Absent'),
    )

    METHOD_CHOICES = (
        ('face_id', 'Face ID'),
        ('pin', 'PIN'),
        ('qr', 'QR Code'),
        ('gps', 'GPS'),
        ('manual', 'Manual'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='attendance_records')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')
    check_in_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='manual')
    check_out_method = models.CharField(max_length=20, choices=METHOD_CHOICES, null=True, blank=True)
    
    late_seconds = models.PositiveIntegerField(default=0)
    net_seconds = models.PositiveIntegerField(default=0)
    overtime_seconds = models.PositiveIntegerField(default=0)
    night_seconds = models.PositiveIntegerField(default=0)
    
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'date')
        
    def __str__(self):
        return f"{self.user.phone} - {self.date} - {self.status}"

class BreakRecord(models.Model):
    attendance = models.ForeignKey(AttendanceRecord, on_delete=models.CASCADE, related_name='breaks')
    break_start = models.DateTimeField()
    break_end = models.DateTimeField(null=True, blank=True)
    break_seconds = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"Break for {self.attendance.user.phone} on {self.attendance.date}"
