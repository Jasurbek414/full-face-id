from rest_framework import serializers
from django.utils import timezone
from apps.accounts.models import User
from apps.attendance.models import AttendanceRecord


class EmployeeSerializer(serializers.ModelSerializer):
    system_role = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    today_status = serializers.SerializerMethodField()
    join_date = serializers.DateTimeField(source='date_joined', read_only=True)
    photo_url = serializers.SerializerMethodField()
    has_face_encoding = serializers.SerializerMethodField()
    last_check_in = serializers.SerializerMethodField()
    department_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'phone', 'email',
            'photo', 'photo_url', 'department', 'department_id', 'system_role',
            'is_active', 'join_date', 'today_status',
            'has_face_encoding', 'last_check_in',
        ]
        read_only_fields = ['id', 'join_date', 'today_status', 'has_face_encoding', 'last_check_in']

    def get_system_role(self, obj):
        if obj.role:
            return {'id': str(obj.role.id), 'name': obj.role.name}
        return None

    def get_department(self, obj):
        dept = obj.department
        if dept:
            return {'id': str(dept.id), 'name': dept.name}
        return None

    def get_today_status(self, obj):
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(
            user=obj, date=today, is_deleted=False
        ).first()
        return record.status if record else 'absent'

    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo.url

    def get_has_face_encoding(self, obj):
        return hasattr(obj, 'face_encoding') and obj.face_encoding is not None

    def get_last_check_in(self, obj):
        record = AttendanceRecord.objects.filter(
            user=obj, check_in__isnull=False, is_deleted=False
        ).order_by('-date', '-check_in').first()
        if record and record.check_in:
            return record.check_in.strftime('%Y-%m-%d %H:%M')
        return None

    def update(self, instance, validated_data):
        from apps.companies.models import Department
        department_id = validated_data.pop('department_id', None)
        if department_id is not None:
            company = self.context['request'].user.company
            try:
                dept = Department.objects.get(id=department_id, company=company, is_deleted=False)
                instance.department = dept
            except Department.DoesNotExist:
                pass
        return super().update(instance, validated_data)


class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    department_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'password', 'photo', 'department_id']

    def create(self, validated_data):
        from apps.companies.models import Department
        company = self.context['request'].user.company
        password = validated_data.pop('password')
        department_id = validated_data.pop('department_id', None)
        user = User(**validated_data, company=company)
        user.set_password(password)
        if department_id:
            try:
                dept = Department.objects.get(id=department_id, company=company, is_deleted=False)
                user.department = dept
            except Department.DoesNotExist:
                pass
        user.save()
        return user


class AssignRoleSerializer(serializers.Serializer):
    role_id = serializers.UUIDField()


class AssignScheduleSerializer(serializers.Serializer):
    schedule_id = serializers.UUIDField()
    effective_from = serializers.DateField()
