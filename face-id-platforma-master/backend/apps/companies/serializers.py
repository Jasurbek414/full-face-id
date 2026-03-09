from rest_framework import serializers
from .models import Company, Department, Branch


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ('id', 'name', 'timezone', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class SACompanySerializer(serializers.ModelSerializer):
    """Extended serializer for the SuperAdmin panel, includes subscription info."""
    is_blocked = serializers.SerializerMethodField()
    plan_type = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    subscription_expires_at = serializers.SerializerMethodField()
    monthly_price = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()
    subscription_id = serializers.SerializerMethodField()
    grace_period_days = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = (
            'id', 'name', 'timezone', 'is_active', 'created_at', 'updated_at',
            'is_blocked', 'plan_type', 'subscription_status', 'subscription_expires_at',
            'monthly_price', 'users_count', 'subscription_id', 'grace_period_days', 'notes',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_is_blocked(self, obj):
        return not obj.is_active

    def _get_sub(self, obj):
        return getattr(obj, 'subscription', None)

    def get_plan_type(self, obj):
        sub = self._get_sub(obj)
        if sub is None:
            return 'NO_SUB'
        if sub.plan:
            return sub.plan.name.upper()
        return sub.status

    def get_subscription_status(self, obj):
        sub = self._get_sub(obj)
        return sub.status if sub else 'NO_SUB'

    def get_subscription_expires_at(self, obj):
        sub = self._get_sub(obj)
        return sub.expires_at if sub else None

    def get_monthly_price(self, obj):
        sub = self._get_sub(obj)
        if sub is None:
            return None
        return str(sub.monthly_price) if sub.monthly_price is not None else (
            str(sub.plan.price_per_month) if sub.plan else None
        )

    def get_users_count(self, obj):
        return obj.users.filter(is_active=True).count()

    def get_subscription_id(self, obj):
        sub = self._get_sub(obj)
        return str(sub.id) if sub else None

    def get_grace_period_days(self, obj):
        sub = self._get_sub(obj)
        return sub.grace_period_days if sub else 3

    def get_notes(self, obj):
        sub = self._get_sub(obj)
        return sub.notes if sub else ''

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ('id', 'company', 'parent', 'name', 'created_at', 'updated_at')
        read_only_fields = ('id', 'company', 'created_at', 'updated_at')

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ('id', 'company', 'name', 'latitude', 'longitude', 'radius_m', 'created_at', 'updated_at')
        read_only_fields = ('id', 'company', 'created_at', 'updated_at')
