from django.urls import path, include
from rest_framework.routers import DefaultRouter
# Placeholder ViewSets for subscriptions (will implement views later)
from rest_framework import viewsets, permissions, serializers
from .models import Subscription, Plan

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'

class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.filter(is_deleted=False)
    serializer_class = PlanSerializer
    permission_classes = [permissions.IsAuthenticated]

class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request, 'company') and self.request.company:
            return Subscription.objects.filter(company=self.request.company, is_deleted=False)
        return Subscription.objects.none()

router = DefaultRouter()
router.register('plans', PlanViewSet, basename='plan')
router.register('status', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
