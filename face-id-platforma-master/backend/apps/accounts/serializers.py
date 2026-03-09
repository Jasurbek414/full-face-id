from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from apps.companies.models import Company

User = get_user_model()

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ('id', 'name', 'timezone')

class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    system_role = serializers.SerializerMethodField()
    role = serializers.PrimaryKeyRelatedField(read_only=True)
    role_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'phone', 'email', 'first_name', 'last_name', 'full_name', 'photo', 'system_role', 'role', 'role_name', 'company', 'must_change_pw')

    def get_system_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        return 'employee'

    def get_role_name(self, obj):
        return obj.role.name if obj.role else None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    company_name = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'phone', 'email', 'first_name', 'last_name', 'password', 'company_name')
        read_only_fields = ('id',)

    def create(self, validated_data):
        company_name = validated_data.pop('company_name')
        user = User.objects.create_user(
            phone=validated_data['phone'],
            password=validated_data['password'],
            email=validated_data.get('email'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        from apps.companies.models import Company
        from apps.roles.models import CustomRole
        from apps.roles.services import PermissionService
        from apps.subscriptions.models import Subscription
        from django.utils import timezone

        company = Company.objects.create(name=company_name)
        PermissionService.sync_system_roles(company)
        owner_role = CustomRole.objects.filter(company=company, name='OWNER').first()

        user.company = company
        user.role = owner_role
        user.must_change_pw = True
        user.save(update_fields=['company', 'role', 'must_change_pw'])

        expires_at = timezone.now() + timezone.timedelta(days=7)
        Subscription.objects.create(
            company=company,
            status='TRIAL',
            expires_at=expires_at
        )

        return user


# ---- Email-OTP based registration serializers ----

class EmailRegisterInitSerializer(serializers.Serializer):
    """Step 1: collect all registration info, send 6-digit OTP to email."""
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    company_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "Parollar mos tushmadi."})
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({'email': "Bu email allaqachon ro'yxatdan o'tgan."})
        if User.objects.filter(phone=attrs['phone']).exists():
            raise serializers.ValidationError({'phone': "Bu telefon raqam allaqachon ro'yxatdan o'tgan."})
        return attrs


class EmailOTPVerifySerializer(serializers.Serializer):
    """Step 2: verify 6-digit OTP and complete registration."""
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)


# ---- Login serializers ----

class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=6)

class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

class DeviceTokenSerializer(serializers.Serializer):
    device_token = serializers.CharField()

class UpdateFCMSerializer(serializers.Serializer):
    fcm_token = serializers.CharField()
