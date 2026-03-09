import calendar
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, Sum

from .models import AttendanceRecord, BreakRecord
from .serializers import AttendanceRecordSerializer, CheckInSerializer, BulkAbsentSerializer
from .services import determine_attendance_status, calculate_net_seconds
from apps.schedules.models import UserSchedule

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.filter(is_deleted=False)
    serializer_class = AttendanceRecordSerializer

    def get_queryset(self):
        qs = self.queryset.filter(company=self.request.user.company)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        status_filter = self.request.query_params.get('status')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-date', '-check_in')

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
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
                company=request.user.company,
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

        return Response({
            'status': record.status, 
            'check_in': record.check_in, 
            'message': 'Checked in successfully'
        }, status=status.HTTP_201_CREATED)

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
        
        return Response({
            'check_out': record.check_out,
            'net_seconds': record.net_seconds,
            'message': 'Checked out successfully'
        })
        
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
