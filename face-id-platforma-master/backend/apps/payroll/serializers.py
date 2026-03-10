from rest_framework import serializers
from .models import SalaryConfig, PayrollRecord, PayrollDeduction


class SalaryConfigSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = SalaryConfig
        fields = [
            'id', 'user', 'user_full_name', 'user_phone', 'department_name',
            'salary_type', 'amount', 'overtime_rate', 'night_rate',
            'weekend_rate', 'holiday_rate', 'tax_percent', 'inps_percent',
        ]
        read_only_fields = ['company']

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.phone

    def get_user_phone(self, obj):
        return obj.user.phone

    def get_department_name(self, obj):
        dept = getattr(obj.user, 'department', None)
        return dept.name if dept else None


class PayrollDeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollDeduction
        fields = ['id', 'name', 'deduction_type', 'amount', 'percent', 'note']


class PayrollRecordSerializer(serializers.ModelSerializer):
    user_full_name = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    month_str = serializers.SerializerMethodField()
    gross_salary = serializers.SerializerMethodField()
    deduction_items = PayrollDeductionSerializer(many=True, read_only=True)

    class Meta:
        model = PayrollRecord
        fields = [
            'id', 'user', 'user_full_name', 'user_phone', 'department_name',
            'month', 'month_str',
            'work_days', 'work_hours', 'overtime_hours', 'night_hours',
            'base_salary', 'overtime_pay', 'night_pay', 'gross_salary',
            'tax_amount', 'inps_amount', 'deductions', 'net_salary',
            'status', 'notes', 'deduction_items', 'created_at',
        ]
        read_only_fields = ['company', 'created_at']

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.phone

    def get_user_phone(self, obj):
        return obj.user.phone

    def get_department_name(self, obj):
        dept = getattr(obj.user, 'department', None)
        return dept.name if dept else None

    def get_month_str(self, obj):
        return obj.month.strftime('%Y-%m') if obj.month else None

    def get_gross_salary(self, obj):
        return round(float(obj.base_salary) + float(obj.overtime_pay) + float(obj.night_pay), 2)
