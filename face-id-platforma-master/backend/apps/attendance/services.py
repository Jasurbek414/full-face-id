from zoneinfo import ZoneInfo
from datetime import datetime
from apps.schedules.services import get_user_schedule

def determine_attendance_status(user, check_in_time):
    """
    Returns (status, late_seconds).
    status: 'on_time' or 'late'
    """
    tz_name = 'Asia/Tashkent'
    if user.company and user.company.timezone:
        tz_name = user.company.timezone
        
    company_tz = ZoneInfo(tz_name)
    local_check_in = check_in_time.astimezone(company_tz)
    
    schedule = get_user_schedule(user, local_check_in.date())
    if not schedule:
        return 'on_time', 0
    
    expected_start = datetime.combine(
        local_check_in.date(), schedule.work_start, tzinfo=company_tz
    )
    late_seconds = max(0,
        (local_check_in - expected_start).total_seconds()
        - schedule.late_tolerance_min * 60
    )
    status = 'late' if late_seconds > 0 else 'on_time'
    return status, int(late_seconds)

def calculate_net_seconds(check_in, check_out, breaks):
    """
    Returns net working seconds minus break times.
    """
    if not check_in or not check_out:
        return 0
    total = (check_out - check_in).total_seconds()
    break_total = sum(b.break_seconds for b in breaks)
    return max(0, int(total - break_total))

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def trigger_checkin_websocket(user, status, check_in_time):
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"attendance_{user.company_id}",
                {
                    "type": "attendance_update",
                    "data": {
                        "user_id": str(user.id),
                        "user_name": user.get_full_name() or str(user.phone),
                        "user_photo": None,
                        "status": status,
                        "check_in": check_in_time.isoformat(),
                        "check_in_method": "manual",
                    }
                }
            )
    except Exception:
        pass  # Redis may not be running in dev
