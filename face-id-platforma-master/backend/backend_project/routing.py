from django.urls import path
from apps.superadmin.consumers import SuperAdminGlobalConsumer
from apps.notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    path('ws/sa/global/', SuperAdminGlobalConsumer.as_asgi()),
    path('ws/notifications/', NotificationConsumer.as_asgi()),
]
