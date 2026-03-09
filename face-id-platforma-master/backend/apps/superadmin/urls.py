from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_auth import SALoginView
from .views_dashboard import SADashboardView
from .views_companies import SACompanyViewSet, SAPlanViewSet
from .views_misc import SAAuditLogView, SAExpiringSubsView, SARevenueView, SAAllPaymentsView

router = DefaultRouter()
router.register(r'companies', SACompanyViewSet, basename='sa-companies')
router.register(r'plans', SAPlanViewSet, basename='sa-plans')

urlpatterns = [
    path('auth/login/', SALoginView.as_view(), name='sa-login'),
    path('dashboard/', SADashboardView.as_view(), name='sa-dashboard'),
    path('audit-log/', SAAuditLogView.as_view(), name='sa-audit-log'),
    path('expiring/', SAExpiringSubsView.as_view(), name='sa-expiring'),
    path('revenue/', SARevenueView.as_view(), name='sa-revenue'),
    path('payments/', SAAllPaymentsView.as_view(), name='sa-all-payments'),
    path('', include(router.urls)),
]
