from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import authenticate
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django_redis import get_redis_connection
from .models import User, OTP, EmailOTP
from .serializers import (
    RegisterSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    LoginSerializer,
    EmailLoginSerializer,
    EmailRegisterInitSerializer,
    EmailOTPVerifySerializer,
    ChangePasswordSerializer,
    DeviceTokenSerializer,
    UpdateFCMSerializer,
    UserSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from apps.notifications.providers.eskiz import EskizSMSProvider
import random
import string


def generate_otp_code():
    return ''.join(random.choices(string.digits, k=6))


def get_redis():
    return get_redis_connection("default")


def _create_user_with_company(data: dict):
    """Create user + company + subscription from registration data dict."""
    from apps.companies.models import Company
    from apps.roles.models import CustomRole
    from apps.roles.services import PermissionService
    from apps.subscriptions.models import Subscription

    user = User.objects.create_user(
        phone=data['phone'],
        password=data['password'],
        email=data['email'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )
    company = Company.objects.create(name=data['company_name'])
    PermissionService.sync_system_roles(company)
    owner_role = CustomRole.objects.filter(company=company, name='OWNER').first()
    user.company = company
    user.role = owner_role
    user.must_change_pw = False
    user.save(update_fields=['company', 'role', 'must_change_pw'])
    expires_at = timezone.now() + timezone.timedelta(days=7)
    Subscription.objects.create(company=company, status='TRIAL', expires_at=expires_at)
    return user


# ── Email-based registration (2-step with OTP) ──────────────────────────────

class EmailRegisterInitView(APIView):
    """
    POST /api/v1/auth/email-register/
    Validates form data, stores it temporarily, sends 6-digit OTP to email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailRegisterInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Rate limit: max 3 OTP requests per email per hour
        r = get_redis()
        rate_key = f"email_otp_rate:{data['email']}"
        count = r.get(rate_key)
        if count and int(count) >= 3:
            return Response(
                {"detail": "Juda ko'p so'rov yuborildi. Keyinroq urinib ko'ring."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        code = generate_otp_code()
        expire_minutes = getattr(settings, 'EMAIL_OTP_EXPIRE_MINUTES', 10)
        expires_at = timezone.now() + timezone.timedelta(minutes=expire_minutes)

        EmailOTP.objects.create(
            email=data['email'],
            code=code,
            expires_at=expires_at,
            registration_data={
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'company_name': data['company_name'],
                'email': data['email'],
                'phone': data['phone'],
                'password': data['password'],
            }
        )

        r.incr(rate_key)
        r.expire(rate_key, 3600)

        subject = "WorkTrack Pro - Tasdiqlash kodi"
        message = (
            f"Assalomu alaykum, {data['first_name']}!\n\n"
            f"Ro'yxatdan o'tish uchun tasdiqlash kodingiz:\n\n"
            f"  {code}\n\n"
            f"Ushbu kod {expire_minutes} daqiqa davomida amal qiladi.\n\n"
            f"Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.\n\n"
            f"WorkTrack Pro jamoasi"
        )
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [data['email']],
                fail_silently=False,
            )
        except Exception:
            return Response(
                {"detail": "Email yuborishda xatolik yuz berdi. Email manzilingizni tekshiring."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"detail": f"Tasdiqlash kodi {data['email']} manziliga yuborildi."},
            status=status.HTTP_200_OK
        )


class ResendEmailOTPView(APIView):
    """
    POST /api/v1/auth/email-register/resend/
    Resend OTP to email if pending registration exists.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"detail": "Email kiritilmagan."}, status=status.HTTP_400_BAD_REQUEST)

        # Rate limit check
        r = get_redis_connection('default')
        rate_key = f"email_otp_rate:{email}"
        count = r.get(rate_key)
        if count and int(count) >= 3:
            return Response(
                {"detail": "Juda ko'p so'rov yuborildi. Keyinroq urinib ko'ring."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Find pending OTP
        pending = EmailOTP.objects.filter(email=email, is_used=False).order_by('-created_at').first()
        if not pending:
            return Response({"detail": "Kutilayotgan ro'yxatdan o'tish topilmadi."}, status=status.HTTP_404_NOT_FOUND)

        code = generate_otp_code()
        expire_minutes = getattr(settings, 'EMAIL_OTP_EXPIRE_MINUTES', 10)
        pending.code = code
        pending.expires_at = timezone.now() + timezone.timedelta(minutes=expire_minutes)
        pending.save(update_fields=['code', 'expires_at'])

        r.incr(rate_key)
        r.expire(rate_key, 3600)

        first_name = pending.registration_data.get('first_name', '')
        subject = "WorkTrack Pro - Yangi tasdiqlash kodi"
        message = (
            f"Assalomu alaykum{', ' + first_name if first_name else ''}!\n\n"
            f"Yangi tasdiqlash kodingiz:\n\n"
            f"  {code}\n\n"
            f"Ushbu kod {expire_minutes} daqiqa davomida amal qiladi.\n\n"
            f"WorkTrack Pro jamoasi"
        )
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        except Exception:
            return Response(
                {"detail": "Email yuborishda xatolik. Keyinroq urinib ko'ring."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({"detail": f"Yangi kod {email} manziliga yuborildi."}, status=status.HTTP_200_OK)


class EmailOTPVerifyView(APIView):
    """
    POST /api/v1/auth/email-verify/
    Verifies 6-digit OTP and creates the user account.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        otp = (
            EmailOTP.objects
            .filter(email__iexact=email, code=code, is_used=False)
            .order_by('-created_at')
            .first()
        )

        if not otp:
            return Response({"detail": "Tasdiqlash kodi noto'g'ri."}, status=status.HTTP_400_BAD_REQUEST)

        otp.attempts += 1
        otp.save(update_fields=['attempts'])

        if not otp.is_valid():
            return Response(
                {"detail": "Tasdiqlash kodi muddati o'tgan yoki urinishlar soni tugagan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp.is_used = True
        otp.save(update_fields=['is_used'])

        reg_data = otp.registration_data
        if not reg_data:
            return Response(
                {"detail": "Ro'yxatdan o'tish ma'lumotlari topilmadi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"detail": "Bu email allaqachon ro'yxatdan o'tgan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = _create_user_with_company(reg_data)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


# ── Email login ───────────────────────────────────────────────────────────────

class EmailLoginView(APIView):
    """POST /api/v1/auth/email-login/ — login with email + password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, email=email, password=password)
        if user is None:
            return Response(
                {"detail": "Email yoki parol noto'g'ri."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if user.is_locked:
            return Response({"detail": "Akkaunt bloklangan."}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        })


# ── Email-based direct registration (no OTP) ─────────────────────────────────

class EmailDirectRegisterView(APIView):
    """
    POST /api/v1/auth/email-direct-register/
    Validates form data and immediately creates the account (no OTP step).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailRegisterInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if User.objects.filter(email__iexact=data['email']).exists():
            return Response(
                {"email": "Bu email allaqachon ro'yxatdan o'tgan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = _create_user_with_company(data)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


# ── Legacy phone-based views (kept for backward compat) ──────────────────────

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        r = get_redis()
        key_counter = f"otp_counter:{phone}"
        count = r.get(key_counter)
        if count and int(count) >= 5:
            return Response({"detail": "Too many OTP requests, try later."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        code = generate_otp_code()
        expires_at = timezone.now() + timezone.timedelta(minutes=5)
        OTP.objects.create(phone=phone, code=code, expires_at=expires_at)
        r.incr(key_counter)
        r.expire(key_counter, 3600)
        sms = EskizSMSProvider()
        message = f"Your verification code is {code}. It expires in 5 minutes."
        try:
            sms.send(phone, message)
        except Exception:
            return Response({"detail": "Failed to send SMS."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"detail": "OTP sent."}, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPVerifySerializer

    def post(self, request, *args, **kwargs):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']
        try:
            otp = OTP.objects.get(phone=phone, code=code)
        except OTP.DoesNotExist:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.is_valid():
            return Response({"detail": "OTP expired or attempts exceeded."}, status=status.HTTP_400_BAD_REQUEST)
        otp.attempts = 5
        otp.save(update_fields=['attempts'])
        user, created = User.objects.get_or_create(phone=phone)
        if created:
            from apps.companies.models import Company
            from apps.subscriptions.models import Subscription
            from apps.roles.models import CustomRole
            from apps.roles.services import PermissionService
            company = Company.objects.create(name=f"Company {phone}")
            PermissionService.sync_system_roles(company)
            owner_role = CustomRole.objects.filter(company=company, name='OWNER').first()
            user.company = company
            user.role = owner_role
            user.save(update_fields=['company', 'role'])
            expires_at = timezone.now() + timezone.timedelta(days=7)
            Subscription.objects.create(company=company, status='TRIAL', expires_at=expires_at)
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        })


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        password = serializer.validated_data['password']
        user = authenticate(request, phone=phone, password=password)
        if user is None:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        if user.is_locked:
            return Response({"detail": "Account locked."}, status=status.HTTP_403_FORBIDDEN)
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, *args, **kwargs):
        token = request.data.get('refresh')
        if token:
            try:
                RefreshToken(token).blacklist()
            except Exception:
                pass
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data)

    def patch(self, request, *args, **kwargs):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"detail": "Old password incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.must_change_pw = False
        user.save(update_fields=['password', 'must_change_pw'])
        return Response({"detail": "Password changed."})


class SendResetOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPRequestSerializer
    def post(self, request, *args, **kwargs):
        return OTPRequestView.as_view()(request._request)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = OTPVerifySerializer
    def post(self, request, *args, **kwargs):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']
        try:
            otp = OTP.objects.get(phone=phone, code=code)
        except OTP.DoesNotExist:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp.is_valid():
            return Response({"detail": "OTP expired or attempts exceeded."}, status=status.HTTP_400_BAD_REQUEST)
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({"detail": "New password required."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(phone=phone).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        user.set_password(new_password)
        user.must_change_pw = False
        user.save(update_fields=['password', 'must_change_pw'])
        otp.attempts = 5
        otp.save(update_fields=['attempts'])
        return Response({"detail": "Password reset successful."})


class DeviceTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DeviceTokenSerializer
    def post(self, request, *args, **kwargs):
        return Response({"detail": "Device token received."})


class UpdateFCMView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UpdateFCMSerializer
    def post(self, request, *args, **kwargs):
        return Response({"detail": "FCM token updated."})


# ── Company User Management ───────────────────────────────────────────────────

class CompanyUsersView(APIView):
    """
    GET  /api/v1/auth/company-users/   — list all users in caller's company
    POST /api/v1/auth/company-users/   — invite (create) a new user in the company
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(
            company=request.user.company,
            is_active=True,
        ).select_related('role').order_by('first_name', 'last_name')
        data = []
        for u in users:
            data.append({
                'id': str(u.id),
                'first_name': u.first_name,
                'last_name': u.last_name,
                'full_name': u.get_full_name(),
                'email': u.email or '',
                'phone': u.phone,
                'photo': request.build_absolute_uri(u.photo.url) if u.photo else None,
                'role': {'id': str(u.role.id), 'name': u.role.name} if u.role else None,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
            })
        return Response({'results': data, 'count': len(data)})

    def post(self, request):
        """Create a new user and add them to the caller's company."""
        from apps.roles.models import CustomRole
        d = request.data
        first_name = d.get('first_name', '').strip()
        last_name = d.get('last_name', '').strip()
        email = d.get('email', '').strip()
        phone = d.get('phone', '').strip()
        password = d.get('password', '').strip()
        role_id = d.get('role_id')

        if not phone:
            return Response({'phone': 'Telefon raqam kiritilishi shart.'}, status=400)
        if not password or len(password) < 8:
            return Response({'password': 'Parol kamida 8 ta belgi bo\'lishi kerak.'}, status=400)
        if User.objects.filter(phone=phone).exists():
            return Response({'phone': 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan.'}, status=400)
        if email and User.objects.filter(email__iexact=email).exists():
            return Response({'email': 'Bu email allaqachon ishlatilmoqda.'}, status=400)

        role = None
        if role_id:
            try:
                role = CustomRole.objects.get(id=role_id, company=request.user.company)
            except CustomRole.DoesNotExist:
                return Response({'role_id': 'Rol topilmadi.'}, status=400)

        user = User.objects.create_user(
            phone=phone,
            password=password,
            email=email or None,
            first_name=first_name,
            last_name=last_name,
        )
        user.company = request.user.company
        user.role = role
        user.save(update_fields=['company', 'role'])

        return Response({
            'id': str(user.id),
            'full_name': user.get_full_name(),
            'email': user.email or '',
            'phone': user.phone,
            'role': {'id': str(role.id), 'name': role.name} if role else None,
        }, status=status.HTTP_201_CREATED)


class CompanyUserDetailView(APIView):
    """
    PATCH /api/v1/auth/company-users/<id>/  — update role or basic info
    DELETE /api/v1/auth/company-users/<id>/ — deactivate user
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_user(self, request, pk):
        try:
            return User.objects.get(id=pk, company=request.user.company)
        except User.DoesNotExist:
            return None

    def patch(self, request, pk):
        from apps.roles.models import CustomRole
        user = self._get_user(request, pk)
        if not user:
            return Response({'detail': 'Foydalanuvchi topilmadi.'}, status=404)

        d = request.data
        if 'first_name' in d:
            user.first_name = d['first_name']
        if 'last_name' in d:
            user.last_name = d['last_name']
        if 'email' in d:
            user.email = d['email'] or None
        if 'role_id' in d:
            role_id = d['role_id']
            if role_id is None:
                user.role = None
            else:
                try:
                    user.role = CustomRole.objects.get(id=role_id, company=request.user.company)
                except CustomRole.DoesNotExist:
                    return Response({'role_id': 'Rol topilmadi.'}, status=400)

        user.save()
        return Response({
            'id': str(user.id),
            'full_name': user.get_full_name(),
            'email': user.email or '',
            'phone': user.phone,
            'role': {'id': str(user.role.id), 'name': user.role.name} if user.role else None,
        })

    def delete(self, request, pk):
        if str(request.user.id) == str(pk):
            return Response({'detail': 'O\'z akkauntingizni o\'chira olmaysiz.'}, status=400)
        user = self._get_user(request, pk)
        if not user:
            return Response({'detail': 'Foydalanuvchi topilmadi.'}, status=404)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)
