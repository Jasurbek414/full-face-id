import pytest
from django.utils import timezone
from apps.subscriptions.models import Subscription
from apps.subscriptions.tasks import auto_block_expired
from apps.companies.models import Company

@pytest.mark.django_db
def test_auto_block_expired_task():
    # Setup company with expired subscription
    company = Company.objects.create(name="Expired Co")
    expires_at = timezone.now() - timezone.timedelta(days=1)
    sub = Subscription.objects.create(
        company=company,
        status='TRIAL',
        expires_at=expires_at
    )
    
    # Run task
    result = auto_block_expired()
    
    # Verify
    sub.refresh_from_db()
    company.refresh_from_db()
    assert sub.status == 'BLOCKED'
    assert not company.is_active
    assert "Blocked 1" in result

@pytest.mark.django_db
def test_trial_creation_on_verify(client, mock_redis):
    # This tests the logic in apps/accounts/views.py indirectly
    from django.urls import reverse
    from apps.accounts.models import OTP
    
    phone = '998901234599'
    otp_code = '123456'
    expires_at = timezone.now() + timezone.timedelta(minutes=5)
    OTP.objects.create(phone=phone, code=otp_code, expires_at=expires_at)
    
    url = reverse('otp-verify')
    response = client.post(url, {'phone': phone, 'code': otp_code})
    
    assert response.status_code == 200
    # Check if company and subscription were created
    assert Company.objects.filter(name=f"Company {phone}").exists()
    company = Company.objects.get(name=f"Company {phone}")
    assert Subscription.objects.filter(company=company, status='TRIAL').exists()
