import calendar
from .models import SalaryConfig, PayrollRecord
from apps.attendance.models import AttendanceRecord


def calculate_payroll(user, month_date):
    """
    Calculates salary for a user for a given month based on their attendance.
    Applies tax and INPS deductions from SalaryConfig.
    """
    try:
        config = SalaryConfig.objects.get(user=user, company=user.company, is_deleted=False)
    except SalaryConfig.DoesNotExist:
        return None

    records = AttendanceRecord.objects.filter(
        user=user,
        date__year=month_date.year,
        date__month=month_date.month,
        status__in=['on_time', 'late', 'early_leave'],
        is_deleted=False
    )

    work_days = records.count()
    net_seconds = sum(r.net_seconds or 0 for r in records)
    overtime_seconds = sum(r.overtime_seconds or 0 for r in records)
    night_seconds = sum(r.night_seconds or 0 for r in records)

    amount = float(config.amount)

    if config.salary_type == 'monthly':
        _, total_days = calendar.monthrange(month_date.year, month_date.month)
        base = amount / total_days * work_days
        hourly_rate = amount / (total_days * 8.0)
    elif config.salary_type == 'daily':
        base = work_days * amount
        hourly_rate = amount / 8.0
    else:  # hourly
        base = (net_seconds / 3600.0) * amount
        hourly_rate = amount

    overtime_hours = overtime_seconds / 3600.0
    overtime_pay = overtime_hours * hourly_rate * float(config.overtime_rate)

    night_hours = night_seconds / 3600.0
    night_pay = night_hours * hourly_rate * float(config.night_rate)

    gross = base + overtime_pay + night_pay

    tax_rate = float(config.tax_percent) / 100.0
    inps_rate = float(config.inps_percent) / 100.0
    tax_amount = gross * tax_rate
    inps_amount = gross * inps_rate

    net_salary = gross - tax_amount - inps_amount

    record, _ = PayrollRecord.objects.update_or_create(
        user=user,
        company=user.company,
        month=month_date.replace(day=1),
        defaults={
            'work_days': work_days,
            'work_hours': round(net_seconds / 3600.0, 2),
            'overtime_hours': round(overtime_hours, 2),
            'night_hours': round(night_hours, 2),
            'base_salary': round(base, 2),
            'overtime_pay': round(overtime_pay, 2),
            'night_pay': round(night_pay, 2),
            'tax_amount': round(tax_amount, 2),
            'inps_amount': round(inps_amount, 2),
            'deductions': round(tax_amount + inps_amount, 2),
            'net_salary': round(net_salary, 2),
            'status': 'draft',
        }
    )
    return record
