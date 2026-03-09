import calendar
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum

from .models import AttendanceRecord, BreakRecord
from .serializers import AttendanceRecordSerializer, CheckInSerializer, BulkAbsentSerializer, ManualAttendanceCreateSerializer
from .services import determine_attendance_status, calculate_net_seconds
from apps.schedules.models import UserSchedule
from apps.core.utils import get_request_company

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.filter(is_deleted=False)
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        company = get_request_company(self.request)
        if not company:
            return self.queryset.none()
        qs = self.queryset.filter(company=company)
        p = self.request.query_params
        if p.get('date_from'):
            qs = qs.filter(date__gte=p['date_from'])
        if p.get('date_to'):
            qs = qs.filter(date__lte=p['date_to'])
        if p.get('status'):
            qs = qs.filter(status=p['status'])
        if p.get('user_id'):
            qs = qs.filter(user_id=p['user_id'])
        if p.get('department'):
            qs = qs.filter(user__department_id=p['department'])
        if p.get('method'):
            qs = qs.filter(check_in_method=p['method'])
        if p.get('search'):
            qs = qs.filter(
                Q(user__first_name__icontains=p['search']) |
                Q(user__last_name__icontains=p['search'])
            )
        return qs.order_by('-date', '-check_in')

    def create(self, request, *args, **kwargs):
        import datetime
        company = get_request_company(request)
        if not company:
            return Response({'detail': 'Kompaniya topilmadi.'}, status=status.HTTP_403_FORBIDDEN)

        ser = ManualAttendanceCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data

        from apps.accounts.models import User
        try:
            user = User.objects.get(id=d['user'], company=company, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'Xodim topilmadi.'}, status=status.HTTP_400_BAD_REQUEST)

        target_date = d['date']
        if AttendanceRecord.objects.filter(user=user, date=target_date, is_deleted=False).exists():
            return Response({'detail': 'Bu sana uchun yozuv allaqachon mavjud.'}, status=status.HTTP_400_BAD_REQUEST)

        tz = timezone.get_current_timezone()
        check_in_dt = timezone.make_aware(datetime.datetime.combine(target_date, d['check_in']), tz)
        att_status, late_secs = determine_attendance_status(user, check_in_dt)

        check_out_dt = None
        net_sec = None
        if d.get('check_out'):
            check_out_dt = timezone.make_aware(datetime.datetime.combine(target_date, d['check_out']), tz)
            net_sec = calculate_net_seconds(check_in_dt, check_out_dt, [])

        record = AttendanceRecord.objects.create(
            user=user,
            company=company,
            date=target_date,
            check_in=check_in_dt,
            check_out=check_out_dt,
            status=att_status,
            late_seconds=late_secs,
            net_seconds=net_sec,
            check_in_method=d.get('check_in_method', 'manual'),
        )

        out_ser = AttendanceRecordSerializer(record, context={'request': request})
        return Response(out_ser.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='today-stats')
    def today_stats(self, request):
        company = get_request_company(request)
        if not company:
            return Response({'detail': 'Company not found.'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        qs = AttendanceRecord.objects.filter(company=company, date=today, is_deleted=False)
        stats = qs.aggregate(
            present=Count('id', filter=Q(status__in=['on_time', 'late', 'early_leave'])),
            late=Count('id', filter=Q(status='late')),
            on_time=Count('id', filter=Q(status='on_time')),
            on_site=Count('id', filter=Q(check_in__isnull=False, check_out__isnull=True)),
        )
        from apps.accounts.models import User
        total_employees = User.objects.filter(company=company, is_active=True).count()
        present = stats['present'] or 0
        return Response({
            'total_employees': total_employees,
            'present': present,
            'late': stats['late'] or 0,
            'on_time': stats['on_time'] or 0,
            'on_site': stats['on_site'] or 0,
            'absent': max(total_employees - present, 0),
        })

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        company = get_request_company(request)
        if not company:
            return Response({'detail': 'Kompaniyangiz yo\'q.'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(user=request.user, date=today, is_deleted=False).first()
        if record and record.check_in:
            return Response({'message': 'Already checked in for today'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        method = serializer.validated_data.get('method', 'manual')

        now = timezone.now()
        att_status, late_secs = determine_attendance_status(request.user, now)
        
        from .services import trigger_checkin_websocket
        from apps.notifications.tasks import send_late_notification

        if not record:
            record = AttendanceRecord.objects.create(
                user=request.user,
                company=company,
                date=today,
                check_in=now,
                status=att_status,
                late_seconds=late_secs,
                check_in_method=method
            )
        else:
            record.check_in = now
            record.status = att_status
            record.late_seconds = late_secs
            record.check_in_method = method
            record.save()
            
        # Trigger WebSocket Event
        trigger_checkin_websocket(request.user, record.status, record.check_in)

        # Trigger Late Notification if needed
        if record.status == 'late':
            try:
                send_late_notification.delay(record.id)
            except Exception:
                pass  # Celery may not be running in dev

        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(user=request.user, date=today, is_deleted=False).first()
        if not record or not record.check_in:
            return Response({'message': 'No active check in for today'}, status=status.HTTP_400_BAD_REQUEST)
        
        if record.check_out:
            return Response({'message': 'Already checked out for today'}, status=status.HTTP_400_BAD_REQUEST)
            
        now = timezone.now()
        record.check_out = now
        active_break = record.breaks.filter(break_end__isnull=True).first()
        if active_break:
            active_break.break_end = now
            active_break.break_seconds = int((now - active_break.break_start).total_seconds())
            active_break.save()
            
        net_sec = calculate_net_seconds(record.check_in, now, record.breaks.all())
        record.net_seconds = net_sec
        record.save()
        
        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data)
        
    @action(detail=False, methods=['post'], url_path='break/start')
    def break_start(self, request):
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(user=request.user, date=today, is_deleted=False).first()
        if not record or not record.check_in or record.check_out:
            return Response({'message': 'Invalid attendance state for break'}, status=status.HTTP_400_BAD_REQUEST)
            
        if record.breaks.filter(break_end__isnull=True).exists():
            return Response({'message': 'Already on a break'}, status=status.HTTP_400_BAD_REQUEST)
            
        BreakRecord.objects.create(attendance=record, break_start=timezone.now())
        return Response({'message': 'Break started'})
        
    @action(detail=False, methods=['post'], url_path='break/end')
    def break_end(self, request):
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(user=request.user, date=today, is_deleted=False).first()
        if not record:
            return Response({'message': 'Invalid attendance state'}, status=status.HTTP_400_BAD_REQUEST)
            
        active_break = record.breaks.filter(break_end__isnull=True).first()
        if not active_break:
            return Response({'message': 'Not on a break'}, status=status.HTTP_400_BAD_REQUEST)
            
        now = timezone.now()
        active_break.break_end = now
        active_break.break_seconds = int((now - active_break.break_start).total_seconds())
        active_break.save()
        return Response({'message': 'Break ended'})

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        record = AttendanceRecord.objects.filter(user=request.user, date=today, is_deleted=False).first()
        if record:
            from .serializers import AttendanceRecordSerializer
            data = AttendanceRecordSerializer(record).data
            data['break_seconds'] = sum(b.break_seconds for b in record.breaks.all())
            return Response(data)
        return Response({'message': 'No record for today'}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=False, methods=['get'])
    def live(self, request):
        today = timezone.now().date()
        qs = AttendanceRecord.objects.filter(
            company=request.user.company, 
            date=today, 
            check_in__isnull=False,
            check_out__isnull=True,
            is_deleted=False
        )
        serializer = AttendanceRecordSerializer(qs, many=True)
        return Response({'results': serializer.data, 'count': qs.count()})
        
    @action(detail=False, methods=['get'])
    def summary(self, request):
        now = timezone.now()
        try:
            month = int(request.query_params.get('month', now.month))
            year = int(request.query_params.get('year', now.year))
        except (ValueError, TypeError):
            return Response({'error': 'Invalid month or year'}, status=status.HTTP_400_BAD_REQUEST)

        _, days_in_month = calendar.monthrange(year, month)
        work_days_count = sum(
            1 for d in range(1, days_in_month + 1)
            if calendar.weekday(year, month, d) < 5
        )

        qs = AttendanceRecord.objects.filter(
            user=request.user,
            date__year=year,
            date__month=month,
            is_deleted=False
        )

        stats = qs.aggregate(
            present_days=Count('id', filter=Q(status__in=['on_time', 'late', 'early_leave'])),
            late_days=Count('id', filter=Q(status='late')),
            on_time_days=Count('id', filter=Q(status='on_time')),
            absent_days=Count('id', filter=Q(status='absent')),
            total_seconds=Sum('net_seconds')
        )

        present = stats['present_days'] or 0
        late = stats['late_days'] or 0
        on_time = stats['on_time_days'] or 0
        absent = stats['absent_days'] or 0
        total_secs = stats['total_seconds'] or 0

        total = work_days_count if work_days_count > 0 else 1
        on_time_pct = round((on_time / total) * 100, 1)
        late_pct = round((late / total) * 100, 1)
        absent_pct = round((absent / total) * 100, 1)
        avg_secs = int(total_secs / present) if present > 0 else 0

        return Response({
            'work_days': present,
            'late_count': late,
            'avg_seconds': avg_secs,
            'absent_count': absent,
            'on_time_percent': on_time_pct,
            'late_percent': late_pct,
            'absent_percent': absent_pct,
            'required_hours': work_days_count * 8,
            'worked_hours': int(total_secs / 3600),
            # Backward compatibility
            'present_days': present,
            'late_days': late,
            'absent_days': absent,
            'total_hours': round(total_secs / 3600.0, 2),
        })
        
    @action(detail=False, methods=['get'])
    def weekly(self, request):
        today = timezone.now().date()
        start = today - timezone.timedelta(days=6)
        qs = AttendanceRecord.objects.filter(
            user=request.user,
            date__gte=start,
            date__lte=today,
            is_deleted=False
        ).order_by('date')
        serializer = AttendanceRecordSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk-absent')
    def bulk_absent(self, request):
        serializer = BulkAbsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_date = serializer.validated_data['date']
        
        schedules = UserSchedule.objects.filter(
            company=request.user.company,
            effective_from__lte=target_date
        ).filter(
            Q(effective_to__gte=target_date) | Q(effective_to__isnull=True)
        ).select_related('user')
        
        existing_records_users = set(AttendanceRecord.objects.filter(
            company=request.user.company,
            date=target_date,
            is_deleted=False
        ).values_list('user_id', flat=True))
        
        to_create = []
        for sched in schedules:
            if sched.user_id not in existing_records_users:
                to_create.append(AttendanceRecord(
                    user=sched.user,
                    company=request.user.company,
                    date=target_date,
                    status='absent'
                ))
                
        AttendanceRecord.objects.bulk_create(to_create)
        return Response({'message': f'Marked {len(to_create)} users absent for {target_date}'})
