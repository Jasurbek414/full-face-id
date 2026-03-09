from rest_framework import serializers
from .models import SalaryConfig, PayrollRecord

class SalaryConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryConfig
        fields = '__all__'
        read_only_fields = ['company']

class PayrollRecordSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = PayrollRecord
        fields = '__all__'
        read_only_fields = ['company', 'created_at']
