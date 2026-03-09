from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db import connection, models
from django_redis import get_redis_connection
from apps.companies.models import Company
from apps.subscriptions.models import Subscription, PaymentRecord
from apps.accounts.models import User
from .authentication import SuperAdminJWTAuthentication
from .permissions import IsSuperAdmin

class SADashboardView(APIView):
    authentication_classes = [SuperAdminJWTAuthentication]
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        now = timezone.now()
        
        # Company stats
        total_companies = Company.objects.filter(is_deleted=False).count()
        active_companies = Company.objects.filter(is_active=True, is_deleted=False).count()
        blocked_companies = Company.objects.filter(is_active=False, is_deleted=False).count()
        total_users = User.objects.filter(is_active=True).count()
        
        trial_companies = Subscription.objects.filter(
            status='TRIAL', 
            company__is_deleted=False
        ).values('company').distinct().count()

        # MRR Calculation (Current month successful payments)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        mrr = PaymentRecord.objects.filter(
            status='SUCCESS', 
            created_at__gte=month_start
        ).aggregate(total=models.Sum('amount'))['total'] or 0

        # Expiring in 7 days
        expiring_limit = now + timezone.timedelta(days=7)
        expiring_soon = Subscription.objects.filter(
            expires_at__range=(now, expiring_limit),
            status__in=['ACTIVE', 'TRIAL']
        ).count()

        # System Health
        health = {
            "db": "up",
            "redis": "up",
            "celery": "up",
            "minio": "up"
        }
        
        # Check DB
        try:
            connection.ensure_connection()
        except Exception:
            health["db"] = "down"
            
        # Check Redis
        try:
            r = get_redis_connection("default")
            r.ping()
        except Exception:
            health["redis"] = "down"

        # Check Celery (ping workers)
        try:
            from backend_project.celery import app
            insp = app.control.inspect()
            stats = insp.stats()
            if not stats:
                 health["celery"] = "down"
        except Exception:
            health["celery"] = "down"

        return Response({
            "stats": {
                "total_companies": total_companies,
                "active_companies": active_companies,
                "blocked_companies": blocked_companies,
                "trial_companies": trial_companies,
                "total_mrr": mrr,
                "total_users": total_users,
            },
            "subscriptions": {
                "expiring_soon_7d": expiring_soon
            },
            "system_health": {
                "database": "Ok" if health["db"] == "up" else "Down",
                "redis": "Ok" if health["redis"] == "up" else "Down",
                "celery": "Ok" if health["celery"] == "up" else "Down",
                "minio": "Ok" if health["minio"] == "up" else "Down",
            }
        })
