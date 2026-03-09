from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel

class LeaveType(SoftDeleteModel):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='leave_types')
    name = models.CharField(max_length=100)
    max_days_per_year = models.PositiveIntegerField(default=15)
    is_paid = models.BooleanField(default=True)

    class Meta:
        app_label = 'leaves'

    def __str__(self):
        return f"{self.name} ({self.company.name})"

class LeaveRequest(SoftDeleteModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='leave_requests')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='requests')
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.PositiveIntegerField()
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_leaves'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'leaves'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.leave_type.name} ({self.status})"
