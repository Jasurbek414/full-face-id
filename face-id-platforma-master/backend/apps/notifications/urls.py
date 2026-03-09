from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationPreferenceViewSet

router = DefaultRouter()
router.register('', NotificationViewSet, basename='notification')

urlpatterns = [
    path('preferences/', NotificationPreferenceViewSet.as_view({'get': 'list', 'patch': 'patch'}), name='preferences'),
    path('', include(router.urls)),
]
