from django.db import models
from apps.core.models import SoftDeleteModel
from apps.companies.models import Company

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    module = models.CharField(max_length=100)

    def __str__(self):
        return self.code

class CustomRole(SoftDeleteModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='roles', null=True, blank=True)
    name = models.CharField(max_length=100)
    hierarchy_level = models.PositiveIntegerField(default=0)
    is_system = models.BooleanField(default=False)

    class Meta:
        unique_together = ('company', 'name')

    def __str__(self):
        return f"{self.company.name if self.company else 'SYSTEM'} - {self.name}"

class RolePermission(models.Model):
    SCOPE_CHOICES = (
        ('OWN', 'Own'),
        ('DEPT', 'Department'),
        ('ALL', 'All'),
    )
    role = models.ForeignKey(CustomRole, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='OWN')

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} - {self.permission.code} ({self.scope})"
