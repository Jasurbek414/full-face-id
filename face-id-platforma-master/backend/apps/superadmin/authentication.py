from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from rest_framework import exceptions

class SuperAdminJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        return super().get_header(request)

    def get_validated_token(self, raw_token):
        # We need a custom backend that uses SA_JWT_SECRET
        from rest_framework_simplejwt.backends import TokenBackend
        try:
            backend = TokenBackend(
                'HS256',
                signing_key=settings.SA_JWT_SECRET,
                verifying_key=settings.SA_JWT_SECRET,
            )
            return backend.decode(raw_token, verify=True)
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid SuperAdmin token')

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user.is_superuser:
            raise exceptions.AuthenticationFailed('User is not a SuperAdmin')
        return user
