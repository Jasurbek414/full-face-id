from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, DepartmentViewSet, BranchViewSet

router = DefaultRouter()
router.register('list', CompanyViewSet, basename='company')
router.register('departments', DepartmentViewSet, basename='department')
router.register('branches', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
]
