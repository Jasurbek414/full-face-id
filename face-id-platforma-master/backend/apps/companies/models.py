from django.db import models
from apps.core.models import SoftDeleteModel

class Company(SoftDeleteModel):
    name = models.CharField(max_length=255)
    timezone = models.CharField(max_length=50, default='Asia/Tashkent')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Department(SoftDeleteModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='departments')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.company.name} - {self.name}"

class Branch(SoftDeleteModel):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_m = models.PositiveIntegerField(default=100)  # Radius in meters

    def __str__(self):
        return f"{self.company.name} - {self.name}"
