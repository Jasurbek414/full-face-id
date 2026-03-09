from rest_framework import status, viewsets, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from apps.companies.models import Company
from apps.companies.serializers import SACompanySerializer
from apps.subscriptions.models import Subscription, Plan, PaymentRecord
from apps.subscriptions.serializers import PlanSerializer, PaymentRecordSerializer
from .authentication import SuperAdminJWTAuthentication
from .permissions import IsSuperAdmin
from .models import SuperAdminActionLog


class SACompanyViewSet(viewsets.ModelViewSet):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    serializer_class = SACompanySerializer

    def get_queryset(self):
        qs = Company.objects.filter(is_deleted=False).order_by('-created_at')
        qs = qs.prefetch_related('users').select_related('subscription__plan')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        sub_status = self.request.query_params.get('status')
        if sub_status:
            qs = qs.filter(subscription__status=sub_status.upper())
        return qs

    def _log(self, request, company, action_name, details=None):
        SuperAdminActionLog.objects.create(
            admin=request.user,
            action=action_name,
            target_company=company,
            details=details or {},
            ip_address=request.META.get('REMOTE_ADDR'),
        )

    # ── Block / Unblock ──────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        company = self.get_object()
        company.is_active = False
        company.save(update_fields=['is_active'])
        sub = getattr(company, 'subscription', None)
        if sub and sub.status != 'BLOCKED':
            sub.status = 'BLOCKED'
            sub.save(update_fields=['status'])
        self._log(request, company, 'block')
        return Response({'status': 'company blocked'})

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        company = self.get_object()
        company.is_active = True
        company.save(update_fields=['is_active'])
        sub = getattr(company, 'subscription', None)
        if sub and sub.status == 'BLOCKED':
            # If subscription is still valid, set ACTIVE; else GRACE/TRIAL
            if sub.expires_at > timezone.now():
                sub.status = 'ACTIVE'
            else:
                sub.status = 'GRACE'
            sub.save(update_fields=['status'])
        self._log(request, company, 'unblock')
        return Response({'status': 'company unblocked'})

    # ── Plan / Subscription management ──────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='activate-plan')
    def activate_plan(self, request, pk=None):
        company = self.get_object()
        plan_id = request.data.get('plan_id')
        days = int(request.data.get('days', 30))
        notes = request.data.get('notes', '')

        plan = None
        if plan_id:
            try:
                plan = Plan.objects.get(id=plan_id, is_deleted=False)
            except Plan.DoesNotExist:
                return Response({'detail': 'Plan topilmadi.'}, status=status.HTTP_404_NOT_FOUND)

        expires_at = timezone.now() + timezone.timedelta(days=days)

        sub, created = Subscription.objects.get_or_create(
            company=company,
            defaults={
                'plan': plan,
                'status': 'ACTIVE',
                'expires_at': expires_at,
                'notes': notes,
            }
        )
        if not created:
            sub.plan = plan
            sub.status = 'ACTIVE'
            sub.expires_at = expires_at
            if notes:
                sub.notes = notes
            sub.save(update_fields=['plan', 'status', 'expires_at', 'notes'])

        company.is_active = True
        company.save(update_fields=['is_active'])

        self._log(request, company, 'activate_plan', {
            'plan': plan.name if plan else None,
            'days': days,
            'expires_at': str(expires_at),
        })
        return Response({
            'status': 'plan activated',
            'expires_at': expires_at,
            'subscription_id': str(sub.id),
        })

    @action(detail=True, methods=['post'], url_path='set-price')
    def set_price(self, request, pk=None):
        """Set a custom monthly price for this company."""
        company = self.get_object()
        price = request.data.get('monthly_price')
        if price is None:
            return Response({'detail': 'monthly_price maydoni talab qilinadi.'}, status=400)
        try:
            price = float(price)
            if price < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'detail': "monthly_price musbat son bo'lishi kerak."}, status=400)

        sub, _ = Subscription.objects.get_or_create(
            company=company,
            defaults={'status': 'TRIAL', 'expires_at': timezone.now() + timezone.timedelta(days=7)},
        )
        sub.monthly_price = price
        sub.save(update_fields=['monthly_price'])
        self._log(request, company, 'set_price', {'monthly_price': price})
        return Response({'status': 'price updated', 'monthly_price': price})

    @action(detail=True, methods=['post'], url_path='set-grace')
    def set_grace(self, request, pk=None):
        """Set grace period days for this company."""
        company = self.get_object()
        days = request.data.get('grace_period_days')
        try:
            days = int(days)
            if days < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'detail': "grace_period_days musbat son bo'lishi kerak."}, status=400)
        sub = getattr(company, 'subscription', None)
        if not sub:
            return Response({'detail': 'Obuna topilmadi.'}, status=404)
        sub.grace_period_days = days
        sub.save(update_fields=['grace_period_days'])
        self._log(request, company, 'set_grace', {'grace_period_days': days})
        return Response({'status': 'grace period updated', 'grace_period_days': days})

    # ── Payment recording ────────────────────────────────────────────────────

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        """
        Record a manual payment and extend the subscription accordingly.
        Body: { amount, days (optional, default=30), payment_method, transaction_id (optional), note }
        """
        company = self.get_object()
        amount = request.data.get('amount')
        days = int(request.data.get('days', 30))
        payment_method = request.data.get('payment_method', 'manual')
        transaction_id = request.data.get('transaction_id') or f"SA-{timezone.now().strftime('%Y%m%d%H%M%S')}-{company.id}"
        note = request.data.get('note', '')

        if amount is None:
            return Response({'detail': 'amount maydoni talab qilinadi.'}, status=400)
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({'detail': "amount musbat son bo'lishi kerak."}, status=400)

        # Get or create subscription
        sub, _ = Subscription.objects.get_or_create(
            company=company,
            defaults={'status': 'TRIAL', 'expires_at': timezone.now()},
        )

        # Extend subscription
        now = timezone.now()
        if sub.expires_at > now:
            sub.expires_at += timezone.timedelta(days=days)
        else:
            sub.expires_at = now + timezone.timedelta(days=days)

        sub.status = 'ACTIVE'
        sub.last_payment_date = now
        if note:
            sub.notes = note
        sub.save(update_fields=['status', 'expires_at', 'last_payment_date', 'notes'])

        # Reactivate company
        company.is_active = True
        company.save(update_fields=['is_active'])

        # Save payment record
        payment = PaymentRecord.objects.create(
            subscription=sub,
            amount=amount,
            transaction_id=transaction_id,
            status='SUCCESS',
            payment_method=payment_method,
        )

        self._log(request, company, 'record_payment', {
            'amount': amount,
            'days': days,
            'transaction_id': transaction_id,
            'expires_at': str(sub.expires_at),
        })
        return Response({
            'status': 'payment recorded',
            'amount': amount,
            'expires_at': sub.expires_at,
            'transaction_id': transaction_id,
            'payment_id': str(payment.id),
        })

    @action(detail=True, methods=['get'], url_path='payments')
    def payments(self, request, pk=None):
        """List all payments for this company."""
        company = self.get_object()
        sub = getattr(company, 'subscription', None)
        if not sub:
            return Response([])
        payments = PaymentRecord.objects.filter(subscription=sub).order_by('-payment_date')
        return Response(PaymentRecordSerializer(payments, many=True).data)

    @action(detail=True, methods=['get'], url_path='employees')
    def employees(self, request, pk=None):
        """List all employees/users in this company."""
        company = self.get_object()
        from apps.accounts.models import User
        users = User.objects.filter(company=company, is_active=True).select_related('role').order_by('-date_joined')
        data = [{
            'id': str(u.id),
            'phone': u.phone,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'full_name': u.get_full_name() or u.phone,
            'role': u.role.name if u.role else None,
            'is_active': u.is_active,
            'date_joined': u.date_joined,
            'must_change_pw': u.must_change_pw,
        } for u in users]
        return Response(data)

    @action(detail=True, methods=['get'], url_path='devices')
    def devices(self, request, pk=None):
        """List all devices/cameras in this company."""
        company = self.get_object()
        from apps.devices.models import Device
        devices = Device.objects.filter(company=company).order_by('-created_at')
        from apps.devices.serializers import DeviceSerializer
        return Response(DeviceSerializer(devices, many=True).data)

    @action(detail=True, methods=['get'], url_path='roles')
    def roles(self, request, pk=None):
        """List all roles in this company."""
        company = self.get_object()
        from apps.roles.models import CustomRole
        roles = CustomRole.objects.filter(company=company, is_deleted=False).prefetch_related('permissions').order_by('hierarchy_level')
        data = [{
            'id': str(r.id),
            'name': r.name,
            'hierarchy_level': r.hierarchy_level,
            'is_system': r.is_system,
            'permissions_count': r.permissions.count(),
            'users_count': r.users.filter(is_active=True).count(),
            'created_at': r.created_at,
        } for r in roles]
        return Response(data)

    @action(detail=True, methods=['get'], url_path='attendance-stats')
    def attendance_stats(self, request, pk=None):
        """Get attendance stats for company."""
        company = self.get_object()
        from apps.attendance.models import AttendanceRecord
        from django.utils import timezone
        today = timezone.now().date()

        today_records = AttendanceRecord.objects.filter(company=company, date=today, is_deleted=False)
        total_employees = company.users.filter(is_active=True).count()
        checked_in = today_records.exclude(check_in=None).count()
        on_time = today_records.filter(status='on_time').count()
        late = today_records.filter(status='late').count()
        absent = today_records.filter(status='absent').count()

        return Response({
            'total_employees': total_employees,
            'checked_in': checked_in,
            'on_time': on_time,
            'late': late,
            'absent': absent,
            'date': today,
        })

    @action(detail=True, methods=['post'], url_path='toggle-auto-renew')
    def toggle_auto_renew(self, request, pk=None):
        """Toggle auto-renew for company subscription."""
        company = self.get_object()
        sub = getattr(company, 'subscription', None)
        if not sub:
            return Response({'detail': 'Obuna topilmadi.'}, status=404)
        sub.auto_renew = not sub.auto_renew
        sub.save(update_fields=['auto_renew'])
        self._log(request, company, 'toggle_auto_renew', {'auto_renew': sub.auto_renew})
        return Response({'status': 'updated', 'auto_renew': sub.auto_renew})

    @action(detail=True, methods=['patch'], url_path='update-notes')
    def update_notes(self, request, pk=None):
        """Update admin notes for this company's subscription."""
        company = self.get_object()
        sub = getattr(company, 'subscription', None)
        if not sub:
            return Response({'detail': 'Obuna topilmadi.'}, status=404)
        notes = request.data.get('notes', '')
        sub.notes = notes
        sub.save(update_fields=['notes'])
        return Response({'status': 'notes updated'})

    @action(detail=True, methods=['post'], url_path='extend')
    def extend(self, request, pk=None):
        """Extend subscription by N days without recording payment."""
        company = self.get_object()
        days = int(request.data.get('days', 30))
        if days <= 0:
            return Response({'detail': "days musbat son bo'lishi kerak."}, status=400)
        sub = getattr(company, 'subscription', None)
        if not sub:
            return Response({'detail': 'Obuna topilmadi.'}, status=404)
        now = timezone.now()
        if sub.expires_at > now:
            sub.expires_at += timezone.timedelta(days=days)
        else:
            sub.expires_at = now + timezone.timedelta(days=days)
        if sub.status in ('BLOCKED', 'GRACE'):
            sub.status = 'ACTIVE'
            company.is_active = True
            company.save(update_fields=['is_active'])
        sub.save(update_fields=['expires_at', 'status'])
        self._log(request, company, 'extend_subscription', {'days': days, 'expires_at': str(sub.expires_at)})
        return Response({'status': 'extended', 'expires_at': sub.expires_at, 'days_added': days})


# ── Plan management ──────────────────────────────────────────────────────────

class SAPlanViewSet(viewsets.ModelViewSet):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    serializer_class = PlanSerializer
    queryset = Plan.objects.filter(is_deleted=False).order_by('price_per_month')
