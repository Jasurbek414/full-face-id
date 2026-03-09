import calendar
from .models import SalaryConfig, PayrollRecord
from apps.attendance.models import AttendanceRecord

def calculate_payroll(user, month_date):
    """
    Calculates salary for a user for a given month based on their attendance.
    """
    try:
        config = SalaryConfig.objects.get(user=user, company=user.company, is_deleted=False)
    except SalaryConfig.DoesNotExist:
        return None

    # Filter attendance records for the month
    records = AttendanceRecord.objects.filter(
        user=user,
        date__year=month_date.year,
        date__month=month_date.month,
        status__in=['on_time', 'late', 'early_leave'],
        is_deleted=False
    )

    work_days = records.count()
    net_seconds = sum(r.net_seconds for r in records)
    overtime_seconds = sum(r.overtime_seconds for r in records)
    night_seconds = sum(r.night_seconds for r in records)

    amount = float(config.amount)
    
    # Base calculation
    if config.salary_type == 'monthly':
        _, total_days = calendar.monthrange(month_date.year, month_date.month)
        base = amount / total_days * work_days
        hourly_rate = amount / (total_days * 8.0) # Assume 8h work day for rate derivation
    elif config.salary_type == 'daily':
        base = work_days * amount
        hourly_rate = amount / 8.0
    else:  # hourly
        base = (net_seconds / 3600.0) * amount
        hourly_rate = amount

    # Extras
    overtime_hours = overtime_seconds / 3600.0
    overtime_pay = overtime_hours * hourly_rate * float(config.overtime_rate)
    
    night_hours = night_seconds / 3600.0
    night_pay = night_hours * hourly_rate * float(config.night_rate)
    
    net_salary = base + overtime_pay + night_pay
    
    # Update or create record
    record, _ = PayrollRecord.objects.update_or_create(
        user=user,
        company=user.company,
        month=month_date.replace(day=1),
        defaults={
            'work_days': work_days,
            'work_hours': round(net_seconds / 3600.0, 2),
            'overtime_hours': round(overtime_seconds / 3600.0, 2),
            'night_hours': round(night_seconds / 3600.0, 2),
            'base_salary': round(base, 2),
            'overtime_pay': round(overtime_pay, 2),
            'night_pay': round(night_pay, 2),
            'net_salary': round(net_salary, 2),
            'status': 'draft'
        }
    )
    return record
