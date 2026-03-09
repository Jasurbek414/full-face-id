from django.urls import path
from .views import (
    RegisterView,
    OTPRequestView,
    OTPVerifyView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    SendResetOTPView,
    ResetPasswordView,
    DeviceTokenView,
    UpdateFCMView,
    EmailRegisterInitView,
    EmailOTPVerifyView,
    EmailLoginView,
    EmailDirectRegisterView,
    ResendEmailOTPView,
    CompanyUsersView,
    CompanyUserDetailView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Email-based registration & login (primary flow)
    path('email-register/', EmailRegisterInitView.as_view(), name='email-register'),
    path('email-register/resend/', ResendEmailOTPView.as_view(), name='email-register-resend'),
    path('email-verify/', EmailOTPVerifyView.as_view(), name='email-verify'),
    path('email-direct-register/', EmailDirectRegisterView.as_view(), name='email-direct-register'),
    path('email-login/', EmailLoginView.as_view(), name='email-login'),

    # Legacy phone-based (kept for backward compat / mobile)
    path('register/', RegisterView.as_view(), name='register'),
    path('otp/request/', OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp-verify'),
    path('login/', LoginView.as_view(), name='login'),

    # Common
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('send-reset-otp/', SendResetOTPView.as_view(), name='send-reset-otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('device-token/', DeviceTokenView.as_view(), name='device-token'),
    path('update-fcm/', UpdateFCMView.as_view(), name='update-fcm'),
    path('company-users/', CompanyUsersView.as_view(), name='company-users'),
    path('company-users/<str:pk>/', CompanyUserDetailView.as_view(), name='company-user-detail'),
]
