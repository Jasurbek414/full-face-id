from datetime import date
from zoneinfo import ZoneInfo
from django.db import models
from django.utils import timezone
from .models import WorkSchedule, UserSchedule

def get_company_now(company):
    """
    Returns the current time in the company's specific timezone.
    """
    tz_name = company.timezone or 'Asia/Tashkent'
    tz = ZoneInfo(tz_name)
    return timezone.now().astimezone(tz)

def get_user_schedule(user, check_date: date) -> WorkSchedule:
    """
    Retrieves the active WorkSchedule for a user on a specific date.
    Returns None if no schedule is found.
    """
    # Logic: Find a UserSchedule that covers the target date
    user_schedule = UserSchedule.objects.filter(
        user=user,
        effective_from__lte=check_date
    ).filter(
        models.Q(effective_to__gte=check_date) | models.Q(effective_to__isnull=True)
    ).order_by('-effective_from').first()

    if user_schedule:
        return user_schedule.schedule
    return None
