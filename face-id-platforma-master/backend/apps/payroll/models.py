from django.db import models
from django.conf import settings
from apps.core.models import SoftDeleteModel

class SalaryConfig(SoftDeleteModel):
    SALARY_TYPE_CHOICES = (
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('monthly', 'Monthly'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='salary_config')
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='salary_configs')
    salary_type = models.CharField(max_length=20, choices=SALARY_TYPE_CHOICES, default='monthly')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    overtime_rate = models.DecimalField(max_digits=4, decimal_places=2, default=1.5)
    night_rate = models.DecimalField(max_digits=4, decimal_places=2, default=2.0)
    weekend_rate = models.DecimalField(max_digits=4, decimal_places=2, default=2.0)
    holiday_rate = models.DecimalField(max_digits=4, decimal_places=2, default=3.0)

    class Meta:
        app_label = 'payroll'

class PayrollRecord(SoftDeleteModel):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
    )

    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='payroll_records')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payroll_records')
    month = models.DateField()  # Typically stored as the first day of the month
    work_days = models.PositiveIntegerField(default=0)
    work_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    night_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    night_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'payroll'
        ordering = ['-month', 'user']
        unique_together = ('user', 'month')

    def __str__(self):
        return f"Payroll {self.user.get_full_name()} - {self.month.strftime('%Y-%m')}"
