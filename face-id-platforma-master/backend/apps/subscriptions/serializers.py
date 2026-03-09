from rest_framework import serializers
from .models import Subscription, Plan, PaymentRecord

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Subscription
        fields = '__all__'

class PaymentRecordSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='subscription.company.name', read_only=True)
    company_id = serializers.CharField(source='subscription.company.id', read_only=True)

    class Meta:
        model = PaymentRecord
        fields = '__all__'
