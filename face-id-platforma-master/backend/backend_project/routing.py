from django.urls import path
from apps.superadmin.consumers import SuperAdminGlobalConsumer
from apps.notifications.consumers import NotificationConsumer
from apps.attendance.consumers import AttendanceConsumer

websocket_urlpatterns = [
    path('ws/sa/global/', SuperAdminGlobalConsumer.as_asgi()),
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    path('ws/attendance/', AttendanceConsumer.as_asgi()),
]
