from rest_framework import serializers

class DailyReportSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    user_name = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    date = serializers.DateField()
    check_in = serializers.DateTimeField(allow_null=True)
    check_out = serializers.DateTimeField(allow_null=True)
    status = serializers.CharField()
    net_hours = serializers.FloatField()
    late_minutes = serializers.IntegerField()

class MonthlyReportSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    user_name = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    month = serializers.CharField()
    present_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    total_hours = serializers.FloatField()
    overtime_hours = serializers.FloatField()
    attendance_rate = serializers.FloatField()

class SummaryReportSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    on_time = serializers.IntegerField()
    average_attendance_rate = serializers.FloatField()

class LateAnalysisSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    user_name = serializers.CharField()
    department = serializers.CharField(allow_null=True)
    late_count = serializers.IntegerField()
    total_late_minutes = serializers.IntegerField()
