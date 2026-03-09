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
        company = getattr(self.request.user, 'company', None)
        if company:
            return Subscription.objects.filter(company=company, is_deleted=False)
        return Subscription.objects.none()

    def list(self, request, *args, **kwargs):
        """Return current company subscription as single object (not list)."""
        qs = self.get_queryset()
        instance = qs.order_by('-created_at').first()
        if instance:
            return Response(self.get_serializer(instance).data)
        return Response({'detail': 'No active subscription'}, status=404)

router = DefaultRouter()
router.register('plans', PlanViewSet, basename='plan')
router.register('status', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
