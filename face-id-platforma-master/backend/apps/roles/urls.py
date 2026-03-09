from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PermissionViewSet, CustomRoleViewSet

router = DefaultRouter()
router.register(r'permissions', PermissionViewSet)
router.register(r'roles', CustomRoleViewSet, basename='custom-role')

urlpatterns = [
    path('', include(router.urls)),
]
