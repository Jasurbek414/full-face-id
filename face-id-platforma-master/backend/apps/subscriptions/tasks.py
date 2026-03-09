from celery import shared_task
from django.utils import timezone
from .models import Subscription


@shared_task
def auto_block_expired():
    """
    Move expired subscriptions through the lifecycle:
      TRIAL/ACTIVE  → GRACE  (if within grace_period_days after expiry)
      GRACE         → BLOCKED (if past grace period)
    Company is deactivated only when status reaches BLOCKED.
    """
    now = timezone.now()
    moved_to_grace = 0
    hard_blocked = 0

    # 1. TRIAL / ACTIVE that just expired → move to GRACE
    newly_expired = Subscription.objects.filter(
        expires_at__lt=now,
        status__in=['TRIAL', 'ACTIVE'],
    )
    for sub in newly_expired:
        sub.status = 'GRACE'
        sub.save(update_fields=['status'])
        moved_to_grace += 1

    # 2. GRACE that passed grace period → BLOCKED
    grace_expired = Subscription.objects.select_related('company').filter(
        status='GRACE',
    )
    for sub in grace_expired:
        grace_deadline = sub.expires_at + timezone.timedelta(days=sub.grace_period_days)
        if now >= grace_deadline:
            sub.status = 'BLOCKED'
            sub.save(update_fields=['status'])
            company = sub.company
            company.is_active = False
            company.save(update_fields=['is_active'])
            hard_blocked += 1

    return (
        f"auto_block_expired: {moved_to_grace} moved to GRACE, "
        f"{hard_blocked} hard-blocked."
    )


@shared_task
def auto_unblock_paid():
    """
    Unblock companies whose subscription has been paid and extended
    (status=BLOCKED but expires_at is in the future).
    This runs after a payment is recorded to catch any async delays.
    """
    now = timezone.now()
    unblocked = 0
    subs = Subscription.objects.select_related('company').filter(
        status='BLOCKED',
        expires_at__gt=now,
    )
    for sub in subs:
        sub.status = 'ACTIVE'
        sub.save(update_fields=['status'])
        company = sub.company
        if not company.is_active:
            company.is_active = True
            company.save(update_fields=['is_active'])
        unblocked += 1
    return f"auto_unblock_paid: {unblocked} companies unblocked."
