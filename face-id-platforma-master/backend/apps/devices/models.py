import secrets
import uuid
from django.db import models
from apps.companies.models import Company


def generate_api_key():
    return secrets.token_hex(32)  # 64 char hex string


class Device(models.Model):
    DEVICE_TYPE_CHOICES = [
        ('camera', 'Kamera'),
        ('face_id', 'Yuz ID qurilmasi'),
    ]

    CHECK_TYPE_CHOICES = [
        ('entry', 'Kirish'),
        ('exit', 'Chiqish'),
        ('both', 'Ikkalasi'),
    ]

    CONNECTION_STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('unknown', "Noma'lum"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='devices')
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPE_CHOICES, default='face_id')
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=255, blank=True)

    # Network info
    ip_address = models.CharField(max_length=50, blank=True)
    port = models.PositiveIntegerField(null=True, blank=True)
    mac_address = models.CharField(max_length=20, blank=True)
    rtsp_url = models.CharField(max_length=500, blank=True)
    device_username = models.CharField(max_length=100, blank=True)
    device_password = models.CharField(max_length=100, blank=True)

    # Connection state
    connection_status = models.CharField(
        max_length=20, choices=CONNECTION_STATUS_CHOICES, default='unknown'
    )
    last_ping = models.DateTimeField(null=True, blank=True)

    api_key = models.CharField(max_length=64, unique=True, default=generate_api_key)
    face_threshold = models.FloatField(default=0.60)
    check_type = models.CharField(
        max_length=10,
        choices=CHECK_TYPE_CHOICES,
        default='both'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company.name} — {self.name}"
