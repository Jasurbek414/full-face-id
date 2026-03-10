from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalaryConfigViewSet, PayrollViewSet, PayrollDeductionView

router = DefaultRouter()
router.register('config', SalaryConfigViewSet, basename='salary-config')
router.register('records', PayrollViewSet, basename='payroll')

urlpatterns = [
    path('', include(router.urls)),
    path('records/<int:record_id>/deductions/', PayrollDeductionView.as_view(), name='payroll-deductions'),
]
