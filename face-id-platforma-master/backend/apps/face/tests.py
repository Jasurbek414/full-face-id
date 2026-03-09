import base64
import pickle
try:
    import numpy as np
except ImportError:
    class MockNumpy:
        def zeros(self, *args, **kwargs): return [0.0]*128
    np = MockNumpy()
from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from apps.accounts.models import User
from apps.companies.models import Company
from apps.devices.models import Device
from apps.face.models import FaceEncoding, FaceAttempt
from apps.attendance.models import AttendanceRecord

FAKE_ENCODING = np.zeros(128, dtype=np.float64)
DUMMY_B64 = base64.b64encode(b'\xff\xd8\xff' + b'\x00' * 100).decode()


def make_test_company():
    return Company.objects.create(name="FaceTest Corp", timezone="Asia/Tashkent")


def make_test_user(company):
    return User.objects.create_user(phone="998900099001", password="p", company=company)


def make_test_device(company, active=True):
    return Device.objects.create(company=company, name="Camera 1", is_active=active)


class FaceCheckInViewTests(APITestCase):
    def setUp(self):
        self.company = make_test_company()
        self.user = make_test_user(self.company)
        self.device = make_test_device(self.company)
        self.client = APIClient()

        # Store face encoding for user
        fe = FaceEncoding.objects.create(user=self.user, company=self.company, encoding=b'')
        fe.set_encoding(FAKE_ENCODING)
        fe.save()

    def _headers(self):
        return {'HTTP_AUTHORIZATION': f'ApiKey {self.device.api_key}'}

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    @patch('apps.face.views.compare_to_stored')
    def test_check_in_success(self, mock_compare, mock_encodings, mock_decode):
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = [FAKE_ENCODING]
        mock_compare.return_value = (self.user, 0.35)

        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64, 'device_id': str(self.device.id)}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', **self._headers())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['user_id'], str(self.user.id))
        self.assertEqual(resp.data['message'], 'Check-in successful')
        self.assertTrue(FaceAttempt.objects.filter(user=self.user, success=True).exists())

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    @patch('apps.face.views.compare_to_stored')
    def test_check_in_face_not_recognized(self, mock_compare, mock_encodings, mock_decode):
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = [FAKE_ENCODING]
        mock_compare.return_value = (None, 0.85)

        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', **self._headers())
        self.assertEqual(resp.status_code, 401)
        # Log should still be created
        self.assertTrue(FaceAttempt.objects.filter(success=False, distance=0.85).exists())

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    def test_check_in_no_face_detected(self, mock_encodings, mock_decode):
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = []

        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', **self._headers())
        self.assertEqual(resp.status_code, 400)

    def test_check_in_missing_api_key(self):
        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertIn(resp.status_code, [401, 403])

    def test_check_in_invalid_api_key(self):
        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', HTTP_AUTHORIZATION='ApiKey badkey')
        self.assertIn(resp.status_code, [401, 403])

    def test_check_in_blocked_device(self):
        blocked = make_test_device(self.company, active=False)
        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', HTTP_AUTHORIZATION=f'ApiKey {blocked.api_key}')
        self.assertEqual(resp.status_code, 403)

    def test_check_in_missing_photo(self):
        import json
        url = reverse('face-check-in')
        resp = self.client.post(url, data=json.dumps({}), content_type='application/json', **self._headers())
        self.assertEqual(resp.status_code, 400)

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    @patch('apps.face.views.compare_to_stored')
    def test_check_in_already_checked_in_entry_only(self, mock_compare, mock_encodings, mock_decode):
        """If device is 'entry', it should just say 'Already checked in' if already in."""
        self.device.check_type = 'entry'
        self.device.save()
        
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = [FAKE_ENCODING]
        mock_compare.return_value = (self.user, 0.35)
        AttendanceRecord.objects.create(
            user=self.user, company=self.company,
            date=timezone.now().date(), check_in=timezone.now(), status='on_time'
        )
        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', **self._headers())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['message'], 'Already checked in')

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    @patch('apps.face.views.compare_to_stored')
    def test_check_in_toggle_to_check_out(self, mock_compare, mock_encodings, mock_decode):
        """If device is 'both', it should toggle to check-out if already in."""
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = [FAKE_ENCODING]
        mock_compare.return_value = (self.user, 0.35)
        
        # Pre-create check-in
        AttendanceRecord.objects.create(
            user=self.user, company=self.company,
            date=timezone.now().date(), check_in=timezone.now(), status='on_time'
        )
        
        import json
        url = reverse('face-check-in')
        data = {'photo': DUMMY_B64}
        # Device defaults to 'both', so it should toggle to out
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json', **self._headers())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['message'], 'Check-out successful')
        
        # Verify check_out is set
        record = AttendanceRecord.objects.get(user=self.user, date=timezone.now().date())
        self.assertIsNotNone(record.check_out)


class EmployeeFaceViewTests(APITestCase):
    def setUp(self):
        self.company = make_test_company()
        self.admin = User.objects.create_user(phone="998900099002", password="p", company=self.company)
        self.employee = User.objects.create_user(phone="998900099003", password="p", company=self.company)
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    def test_upload_face_encoding(self, mock_encodings, mock_decode):
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = [FAKE_ENCODING]
        import json
        url = reverse('employee-face', args=[self.employee.pk])
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(FaceEncoding.objects.filter(user=self.employee).exists())

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    def test_update_existing_encoding(self, mock_encodings, mock_decode):
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = [FAKE_ENCODING]
        FaceEncoding.objects.create(user=self.employee, company=self.company, encoding=b'old')
        import json
        url = reverse('employee-face', args=[self.employee.pk])
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(resp.status_code, 200)

    @patch('apps.face.views.decode_base64_image')
    @patch('apps.face.views.get_face_encodings')
    def test_upload_no_face_detected(self, mock_encodings, mock_decode):
        mock_decode.return_value = np.zeros((100, 100, 3), dtype=np.uint8)
        mock_encodings.return_value = []
        import json
        url = reverse('employee-face', args=[self.employee.pk])
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(resp.status_code, 400)

    def test_delete_face_encoding(self):
        FaceEncoding.objects.create(user=self.employee, company=self.company, encoding=pickle.dumps(FAKE_ENCODING))
        url = reverse('employee-face', args=[self.employee.pk])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(FaceEncoding.objects.filter(user=self.employee).exists())

    def test_delete_nonexistent_encoding(self):
        url = reverse('employee-face', args=[self.employee.pk])
        resp = self.client.delete(url)
        self.assertEqual(resp.status_code, 404)

    def test_upload_other_company_employee(self):
        other = Company.objects.create(name="Other", timezone="UTC")
        other_emp = User.objects.create_user(phone="998999999001", password="p", company=other)
        import json
        url = reverse('employee-face', args=[other_emp.pk])
        data = {'photo': DUMMY_B64}
        resp = self.client.post(url, data=json.dumps(data), content_type='application/json')
        self.assertEqual(resp.status_code, 404)


class FaceServiceTests(APITestCase):
    """Test face services module directly."""
    def test_hash_image(self):
        from apps.face.services import hash_image
        h = hash_image("somedata")
        self.assertEqual(len(h), 64)

    def test_decode_base64_error(self):
        from apps.face.services import decode_base64_image
        try:
            decode_base64_image("not_valid_base64!!!")
        except Exception:
            pass  # Expected to raise

    def test_face_encoding_model_pickle(self):
        company = make_test_company()
        user = User.objects.create_user(phone="998900099004", password="p", company=company)
        fe = FaceEncoding(user=user, company=company)
        fe.set_encoding(FAKE_ENCODING)
        result = fe.get_encoding()
        self.assertIsInstance(result, np.ndarray)
        self.assertEqual(result.shape, (128,))
