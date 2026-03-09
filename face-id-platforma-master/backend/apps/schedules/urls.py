from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkScheduleViewSet, ShiftTemplateViewSet

router = DefaultRouter()
router.register(r'work-schedules', WorkScheduleViewSet, basename='work-schedule')
router.register(r'shift-templates', ShiftTemplateViewSet, basename='shift-template')

urlpatterns = [
    path('', include(router.urls)),
]
