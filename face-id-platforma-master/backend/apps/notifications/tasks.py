from celery import shared_task
from django.utils import timezone
from .models import Notification
from apps.attendance.models import AttendanceRecord
from apps.accounts.models import User
from apps.notifications.providers.eskiz import EskizSMSProvider

@shared_task(queue='notifications')
def send_push_notification(user_id, title, message):
    try:
        user = User.objects.get(id=user_id)
        # FCM logic placeholder
        # In a real app, use firebase-admin SDK to send to user.fcm_token
        print(f"Push to {user.get_full_name()}: {title} - {message}")
        return True
    except User.DoesNotExist:
        return False

@shared_task(queue='notifications')
def send_sms_notification(phone, message):
    provider = EskizSMSProvider()
    return provider.send(phone, message)

@shared_task(queue='notifications')
def send_late_notification(attendance_id):
    try:
        record = AttendanceRecord.objects.select_related('user', 'company').get(id=attendance_id)
        user = record.user
        company = record.company
        
        title = "Late Arrival"
        message = f"Hello {user.first_name}, you checked in {record.late_seconds // 60} min late today."
        
        # Create system notification
        Notification.objects.create(
            company=company,
            user=user,
            notification_type='attendance_late',
            title=title,
            message=message
        )
        
        # Async push
        send_push_notification.delay(user.id, title, message)
        
        # SMS if enabled in preferences? 
        # For now just send as requested
        send_sms_notification.delay(user.phone, message)
        
        return True
    except AttendanceRecord.DoesNotExist:
        return False

@shared_task(queue='notifications')
def check_absent_employees():
    """
    Periodic task: check who should be working today but hasn't checked in yet.
    """
    from apps.schedules.models import UserSchedule
    from django.db.models import Q
    
    today = timezone.now().date()
    # Simplified logic: find all active company employees with schedules for today
    # and NO attendance record.
    
    # This task normally runs at 10:00 as requested
    schedules = UserSchedule.objects.filter(
        effective_from__lte=today
    ).filter(
        Q(effective_to__gte=today) | Q(effective_to__isnull=True)
    ).select_related('user', 'company')
    
    for sched in schedules:
        exists = AttendanceRecord.objects.filter(user=sched.user, date=today).exists()
        if not exists:
            # Mark as absent in DB or just notify? Marking in DB is bulk_absent's job.
            # Here we notify.
            user = sched.user
            company = sched.company
            
            title = "Absence Alert"
            message = f"Hello {user.first_name}, we noticed you haven't checked in today yet."
            
            Notification.objects.create(
                company=company,
                user=user,
                notification_type='attendance_absent',
                title=title,
                message=message
            )
            send_sms_notification.delay(user.phone, message)
            
    return True
