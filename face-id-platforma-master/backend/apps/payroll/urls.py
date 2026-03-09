from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryConfigViewSet, PayrollViewSet

router = DefaultRouter()
router.register('config', SalaryConfigViewSet, basename='salary-config')
router.register('records', PayrollViewSet, basename='payroll')

urlpatterns = [
    path('', include(router.urls)),
]
