from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from apps.devices.models import Device
from apps.attendance.services import determine_attendance_status
from apps.attendance.models import AttendanceRecord
from .models import FaceEncoding, FaceAttempt
from .services import decode_base64_image, get_face_encodings, compare_to_stored, hash_image
from .serializers import FaceAttemptSerializer


class ApiKeyAuthentication:
    """Minimal API key checker — not a DRF authenticator, used inline."""
    @staticmethod
    def get_device(request):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('ApiKey '):
            return None, 'Missing ApiKey header'
        key = auth[7:].strip()
        try:
            device = Device.objects.select_related('company').get(api_key=key)
        except Device.DoesNotExist:
            return None, 'Invalid API key'
        if not device.is_active:
            return None, 'Device is blocked'
        return device, None


class FaceAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FaceAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FaceAttempt.objects.filter(
            company=self.request.user.company
        ).select_related('user', 'device').order_by('-created_at')[:100]


class FaceCheckInView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        device, error = ApiKeyAuthentication.get_device(request)
        if error:
            code = status.HTTP_403_FORBIDDEN if device is None and 'blocked' not in error else status.HTTP_401_UNAUTHORIZED
            if 'blocked' in error:
                code = status.HTTP_403_FORBIDDEN
            return Response({'error': error}, status=code)

        photo_b64 = request.data.get('photo', '')
        if not photo_b64:
            return Response({'error': 'photo field required'}, status=status.HTTP_400_BAD_REQUEST)

        photo_hash = hash_image(photo_b64)

        # Decode image
        try:
            image_array = decode_base64_image(photo_b64)
        except Exception as e:
            return Response({'error': f'Image decode error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Extract face encodings
        try:
            encodings = get_face_encodings(image_array)
        except ImportError:
            return Response({'error': 'face_recognition library not available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not encodings:
            FaceAttempt.objects.create(
                device=device, user=None, company=device.company,
                photo_hash=photo_hash, distance=1.0, success=False
            )
            return Response({'error': 'No face found in photo'}, status=status.HTTP_400_BAD_REQUEST)

        incoming = encodings[0]

        # Compare with all stored face encodings for this company
        company_encodings = FaceEncoding.objects.filter(company=device.company).select_related('user')
        matched_user, distance = compare_to_stored(incoming, company_encodings, device.face_threshold)

        # Log attempt
        FaceAttempt.objects.create(
            device=device,
            user=matched_user,
            company=device.company,
            photo_hash=photo_hash,
            distance=distance,
            success=(matched_user is not None)
        )

        if matched_user is None:
            return Response({'error': 'Face not recognized', 'distance': distance}, status=status.HTTP_401_UNAUTHORIZED)

        # Create or update attendance record
        now = timezone.now()
        today = now.date()
        record = AttendanceRecord.objects.filter(user=matched_user, date=today, is_deleted=False).first()

        # check_type logic
        ct = device.check_type
        
        # Determine action: check-in vs check-out
        action = 'in'
        if ct == 'exit':
            action = 'out'
        elif ct == 'both':
            # Toggle: if already checked in and NOT checked out, do check-out
            if record and record.check_in and not record.check_out:
                action = 'out'
            else:
                action = 'in'

        if action == 'in':
            if record and record.check_in:
                return Response({
                    'user_id': str(matched_user.id),
                    'user_name': matched_user.get_full_name() or matched_user.phone,
                    'status': record.status,
                    'check_in_time': record.check_in.isoformat(),
                    'message': 'Already checked in'
                })

            att_status, late_secs = determine_attendance_status(matched_user, now)
            if not record:
                record = AttendanceRecord.objects.create(
                    user=matched_user, company=device.company,
                    date=today, check_in=now,
                    status=att_status, late_seconds=late_secs,
                    check_in_method='face_id'
                )
            else:
                record.check_in = now
                record.status = att_status
                record.late_seconds = late_secs
                record.check_in_method = 'face_id'
                record.save()
            
            return Response({
                'user_id': str(matched_user.id),
                'user_name': matched_user.get_full_name() or matched_user.phone,
                'status': record.status,
                'check_in_time': record.check_in.isoformat(),
                'message': 'Check-in successful'
            }, status=status.HTTP_200_OK)

        else: # action == 'out'
            if not record:
                # No check-in record for today, create one with only check-out? 
                # Usually we need a check-in. But if it's 'exit' only device, maybe they forgot.
                # For now, let's assume they must have a record.
                return Response({'error': 'No check-in record found to check-out'}, status=status.HTTP_400_BAD_REQUEST)
            
            if record.check_out:
                return Response({
                    'user_id': str(matched_user.id),
                    'user_name': matched_user.get_full_name() or matched_user.phone,
                    'check_out_time': record.check_out.isoformat(),
                    'message': 'Already checked out'
                })
            
            record.check_out = now
            record.check_out_method = 'face_id'
            record.save()
            
            return Response({
                'user_id': str(matched_user.id),
                'user_name': matched_user.get_full_name() or matched_user.phone,
                'check_out_time': record.check_out.isoformat(),
                'message': 'Check-out successful'
            }, status=status.HTTP_200_OK)


class SelfFaceEncodeView(APIView):
    """Allow the authenticated user to register/update their own face encoding via image upload."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = None  # accept multipart

    def post(self, request):
        from rest_framework.parsers import MultiPartParser, FormParser
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'image field required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import numpy as np
            from PIL import Image as PILImage
            import io
            img_bytes = image_file.read()
            pil_img = PILImage.open(io.BytesIO(img_bytes)).convert('RGB')
            image_array = np.array(pil_img)
            encodings = get_face_encodings(image_array)
        except ImportError:
            return Response({'error': 'face_recognition not installed on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not encodings:
            return Response({'error': 'No face detected in image'}, status=status.HTTP_400_BAD_REQUEST)

        fe, created = FaceEncoding.objects.get_or_create(
            user=request.user,
            defaults={'company': request.user.company},
        )
        fe.set_encoding(encodings[0])
        fe.company = request.user.company
        fe.save()

        return Response(
            {'message': 'Face encoding saved successfully', 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MobileFaceCheckInView(APIView):
    """
    Mobile app face check-in: JWT-authenticated user sends their image,
    we verify it matches their stored face encoding, then perform check-in/out.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'detail': 'image field required'}, status=status.HTTP_400_BAD_REQUEST)

        # Load image
        try:
            import numpy as np
            from PIL import Image as PILImage
            import io
            img_bytes = image_file.read()
            pil_img = PILImage.open(io.BytesIO(img_bytes)).convert('RGB')
            image_array = np.array(pil_img)
            encodings = get_face_encodings(image_array)
        except ImportError:
            return Response({'detail': 'face_recognition not installed on server'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not encodings:
            return Response({'detail': 'No face detected in image'}, status=status.HTTP_400_BAD_REQUEST)

        # Get user's stored encoding
        try:
            stored_fe = FaceEncoding.objects.get(user=request.user)
        except FaceEncoding.DoesNotExist:
            return Response({'detail': 'Face not registered. Please register your face first.'}, status=status.HTTP_400_BAD_REQUEST)

        _, distance = compare_to_stored(encodings[0], [stored_fe], threshold=0.6)
        if distance > 0.6:
            return Response({'detail': 'Face not recognized. Please try again.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Perform check-in or check-out
        from apps.attendance.services import determine_attendance_status
        now = timezone.now()
        today = now.date()
        record = AttendanceRecord.objects.filter(user=request.user, date=today, is_deleted=False).first()

        if record and record.check_in and not record.check_out:
            # Already checked in — do check-out
            record.check_out = now
            record.check_out_method = 'face_id'
            record.save(update_fields=['check_out', 'check_out_method'])
            from apps.attendance.serializers import AttendanceRecordSerializer
            return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)

        att_status, late_secs = determine_attendance_status(request.user, now)
        if record:
            record.check_in = now
            record.status = att_status
            record.late_seconds = late_secs
            record.check_in_method = 'face_id'
            record.save()
        else:
            record = AttendanceRecord.objects.create(
                user=request.user,
                company=request.user.company,
                date=today,
                check_in=now,
                status=att_status,
                late_seconds=late_secs,
                check_in_method='face_id',
            )

        from apps.attendance.serializers import AttendanceRecordSerializer
        return Response(AttendanceRecordSerializer(record).data, status=status.HTTP_200_OK)


class EmployeeFaceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from apps.accounts.models import User
        try:
            employee = User.objects.get(pk=pk, company=request.user.company)
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        photo_b64 = request.data.get('photo', '')
        if not photo_b64:
            return Response({'error': 'photo required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image_array = decode_base64_image(photo_b64)
            encodings = get_face_encodings(image_array)
        except ImportError:
            return Response({'error': 'face_recognition not installed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if not encodings:
            return Response({'error': 'No face detected in photo'}, status=status.HTTP_400_BAD_REQUEST)

        fe, created = FaceEncoding.objects.get_or_create(
            user=employee, defaults={'company': request.user.company}
        )
        fe.set_encoding(encodings[0])
        fe.company = request.user.company
        fe.save()

        return Response({'message': 'Face encoding saved', 'created': created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, pk):
        from apps.accounts.models import User
        try:
            employee = User.objects.get(pk=pk, company=request.user.company)
        except User.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = FaceEncoding.objects.filter(user=employee).delete()
        if deleted:
            return Response({'message': 'Face encoding deleted'})
        return Response({'error': 'No face encoding found'}, status=status.HTTP_404_NOT_FOUND)
