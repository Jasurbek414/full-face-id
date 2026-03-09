from django.db import models
from apps.core.models import SoftDeleteModel
from apps.companies.models import Company

class Plan(SoftDeleteModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price_per_month = models.DecimalField(max_digits=10, decimal_places=2)
    max_employees = models.PositiveIntegerField()
    features = models.JSONField(default=dict)

    def __str__(self):
        return self.name

class Subscription(SoftDeleteModel):
    STATUS_CHOICES = (
        ('TRIAL', 'Trial'),
        ('ACTIVE', 'Active'),
        ('GRACE', 'Grace Period'),
        ('BLOCKED', 'Blocked'),
    )
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TRIAL')
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                        help_text="Per-company custom monthly price (overrides plan price)")
    grace_period_days = models.PositiveIntegerField(default=3,
                                                    help_text="Days after expiry before hard block")
    notes = models.TextField(blank=True, help_text="Admin notes about this subscription")
    last_payment_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.company.name} - {self.status}"

    def effective_price(self):
        """Return custom monthly price or fall back to plan price."""
        if self.monthly_price is not None:
            return self.monthly_price
        return self.plan.price_per_month if self.plan else None

class PaymentRecord(SoftDeleteModel):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, default='SUCCESS')
    payment_method = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.subscription.company.name} - {self.amount} - {self.payment_date}"
