from rest_framework import serializers
from django.utils import timezone
from apps.accounts.models import User
from apps.attendance.models import AttendanceRecord


class EmployeeSerializer(serializers.ModelSerializer):
    system_role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    today_status = serializers.SerializerMethodField()
    join_date = serializers.DateTimeField(source='date_joined', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'phone',
            'photo', 'department', 'system_role',
            'is_active', 'join_date', 'today_status',
        ]
        read_only_fields = ['id', 'join_date', 'today_status']

    def get_system_role(self, obj):
        if obj.role:
            return {'id': str(obj.role.id), 'name': obj.role.name}
        return None

    def get_department(self, obj):
        dept = getattr(obj, 'department', None)
        if dept:
            return {'id': str(dept.id), 'name': dept.name}
        return None

    def get_today_status(self, obj):
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(
            user=obj, date=today, is_deleted=False
        ).first()
        return record.status if record else 'absent'


class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'password', 'photo']

    def create(self, validated_data):
        company = self.context['request'].user.company
        password = validated_data.pop('password')
        user = User(**validated_data, company=company)
        user.set_password(password)
        user.save()
        return user


class AssignRoleSerializer(serializers.Serializer):
    role_id = serializers.UUIDField()


class AssignScheduleSerializer(serializers.Serializer):
    schedule_id = serializers.UUIDField()
    effective_from = serializers.DateField()
