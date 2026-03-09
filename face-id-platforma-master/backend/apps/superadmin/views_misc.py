from rest_framework import generics, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone

from apps.superadmin.models import SuperAdminActionLog
from apps.subscriptions.models import Subscription, PaymentRecord
from apps.subscriptions.serializers import SubscriptionSerializer, PaymentRecordSerializer
from apps.superadmin.authentication import SuperAdminJWTAuthentication
from apps.superadmin.permissions import IsSuperAdmin


class ActionLogSerializer(serializers.ModelSerializer):
    admin_phone = serializers.CharField(source='admin.phone', read_only=True)
    admin_name = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='target_company.name', read_only=True)

    class Meta:
        model = SuperAdminActionLog
        fields = '__all__'

    def get_admin_name(self, obj):
        return obj.admin.get_full_name() if obj.admin else ''


class SAAuditLogView(generics.ListAPIView):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    serializer_class = ActionLogSerializer

    def get_queryset(self):
        qs = SuperAdminActionLog.objects.select_related('admin', 'target_company').all()
        company_id = self.request.query_params.get('company_id')
        action = self.request.query_params.get('action')
        if company_id:
            qs = qs.filter(target_company_id=company_id)
        if action:
            qs = qs.filter(action__icontains=action)
        return qs


class SAExpiringSubsView(generics.ListAPIView):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    serializer_class = SubscriptionSerializer

    def get_queryset(self):
        now = timezone.now()
        days = int(self.request.query_params.get('days', 7))
        limit = now + timezone.timedelta(days=days)
        return Subscription.objects.filter(
            expires_at__range=(now, limit),
            status__in=['ACTIVE', 'TRIAL', 'GRACE'],
        ).select_related('company', 'plan').order_by('expires_at')


class SARevenueView(APIView):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_revenue = (
            PaymentRecord.objects.filter(status='SUCCESS')
            .aggregate(total=Sum('amount'))['total'] or 0
        )
        mrr = (
            PaymentRecord.objects.filter(status='SUCCESS', payment_date__gte=month_start)
            .aggregate(total=Sum('amount'))['total'] or 0
        )
        # Monthly breakdown (last 12 months)
        from django.db.models import TruncMonth
        monthly = (
            PaymentRecord.objects.filter(status='SUCCESS')
            .annotate(month=TruncMonth('payment_date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('-month')[:12]
        )
        return Response({
            'total_revenue': total_revenue,
            'mrr': mrr,
            'currency': 'UZS',
            'monthly_breakdown': [
                {'month': str(r['month'])[:7], 'total': r['total']} for r in monthly
            ],
        })


class SAAllPaymentsView(generics.ListAPIView):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]
    serializer_class = PaymentRecordSerializer

    def get_queryset(self):
        qs = PaymentRecord.objects.select_related('subscription__company').order_by('-payment_date')
        company_id = self.request.query_params.get('company_id')
        if company_id:
            qs = qs.filter(subscription__company_id=company_id)
        return qs
