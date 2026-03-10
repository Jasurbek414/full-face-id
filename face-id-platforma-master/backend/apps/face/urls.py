from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FaceCheckInView, EmployeeFaceView, FaceAttemptViewSet, SelfFaceEncodeView, MobileFaceCheckInView, EnrolledFacesView

router = DefaultRouter()
router.register('attempts', FaceAttemptViewSet, basename='face-attempt')

urlpatterns = [
    path('', include(router.urls)),
    path('encode/', SelfFaceEncodeView.as_view(), name='face-encode'),
    path('check-in/', FaceCheckInView.as_view(), name='face-check-in'),
    path('checkin/', MobileFaceCheckInView.as_view(), name='face-mobile-checkin'),
    path('employees/<uuid:pk>/face/', EmployeeFaceView.as_view(), name='employee-face'),
    path('enrolled/', EnrolledFacesView.as_view(), name='face-enrolled'),
]
