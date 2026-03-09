import uuid
import pickle
from django.db import models
from django.conf import settings
from apps.companies.models import Company
from apps.devices.models import Device


class FaceEncoding(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='face_encoding'
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='face_encodings')
    encoding = models.BinaryField()  # pickle.dumps(numpy_array)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_encoding(self, numpy_array):
        self.encoding = pickle.dumps(numpy_array)

    def get_encoding(self):
        return pickle.loads(bytes(self.encoding))

    def __str__(self):
        return f"Face of {self.user.phone}"


class FaceAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(Device, on_delete=models.SET_NULL, null=True, related_name='face_attempts')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='face_attempts'
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='face_attempts')
    photo_hash = models.CharField(max_length=64)
    distance = models.FloatField(default=1.0)
    success = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "OK" if self.success else "FAIL"
        return f"[{status}] {self.device} dist={self.distance:.3f}"
