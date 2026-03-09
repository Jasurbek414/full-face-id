from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.dateparse import parse_date
from datetime import datetime
import calendar
from django.db.models import Sum, Count
from django.http import HttpResponse
import csv
import json

from apps.accounts.models import User
from apps.attendance.models import AttendanceRecord
from .serializers import (
    DailyReportSerializer, MonthlyReportSerializer,
    SummaryReportSerializer, LateAnalysisSerializer
)

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_company_users(self, request):
        company = getattr(request.user, 'company', None)
        if not company:
            return User.objects.none()
        qs = User.objects.filter(company=company, is_active=True)
        department = request.query_params.get('department')
        user_id = request.query_params.get('user_id')
        if department:
            qs = qs.filter(department__name=department)
        if user_id:
            qs = qs.filter(id=user_id)
        if not request.user.is_staff and not request.user.groups.filter(name='Manager').exists():
            qs = qs.filter(id=request.user.id)
        return qs

    @action(detail=False, methods=['get'])
    def daily(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            date_val = datetime.now().date()
        else:
            try:
                date_val = parse_date(date_str)
                if date_val is None:
                    return Response({'error': 'Invalid date format'}, status=400)
            except Exception:
                return Response({'error': 'Invalid date format'}, status=400)
        
        users = self._get_company_users(request)
        records = AttendanceRecord.objects.filter(company=request.user.company, date=date_val, is_deleted=False)
        record_map = {r.user_id: r for r in records}
        
        data = []
        for u in users:
            r = record_map.get(u.id)
            department_name = getattr(u.department, 'name', None) if getattr(u, 'department', None) else None
            if r:
                data.append({
                    'user_id': u.id,
                    'user_name': u.get_full_name(),
                    'department': department_name,
                    'date': date_val,
                    'check_in': r.check_in,
                    'check_out': r.check_out,
                    'status': r.status,
                    'net_hours': round(r.net_seconds / 3600.0, 2),
                    'late_minutes': round(r.late_seconds / 60.0),
                })
            else:
                data.append({
                    'user_id': u.id,
                    'user_name': u.get_full_name(),
                    'department': department_name,
                    'date': date_val,
                    'check_in': None,
                    'check_out': None,
                    'status': 'absent',
                    'net_hours': 0.0,
                    'late_minutes': 0,
                })
                
        serializer = DailyReportSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def monthly(self, request):
        month_str = request.query_params.get('month') # expected YYYY-MM
        if not month_str:
            return Response({'error': 'Month required (YYYY-MM)'}, status=400)
            
        try:
            year, month = map(int, month_str.split('-'))
            start_date = datetime(year, month, 1).date()
            _, last_day = calendar.monthrange(year, month)
            end_date = datetime(year, month, last_day).date()
        except Exception:
            return Response({'error': 'Invalid month format (YYYY-MM)'}, status=400)
            
        users = self._get_company_users(request)
        records = AttendanceRecord.objects.filter(
            company=request.user.company,
            date__gte=start_date,
            date__lte=end_date,
            is_deleted=False
        )
        
        data = []
        work_days = sum(1 for d in range(1, last_day + 1) if calendar.weekday(year, month, d) < 5)
        if work_days == 0:
            work_days = 1
            
        for u in users:
            u_records = records.filter(user=u)
            present_days = u_records.filter(status__in=['on_time', 'late', 'early_leave']).count()
            late_days = u_records.filter(status='late').count()
            absent_days = u_records.filter(status='absent').count() + (work_days - u_records.count())
            if absent_days < 0:
                absent_days = 0
                
            total_secs = u_records.aggregate(total=Sum('net_seconds'))['total'] or 0
            overtime_secs = u_records.aggregate(total=Sum('overtime_seconds'))['total'] or 0
            
            attendance_rate = round((present_days / work_days) * 100, 2) if work_days > 0 else 0.0
            department_name = getattr(u.department, 'name', None) if getattr(u, 'department', None) else None
            
            data.append({
                'user_id': u.id,
                'user_name': u.get_full_name(),
                'department': department_name,
                'month': month_str,
                'present_days': present_days,
                'late_days': late_days,
                'absent_days': absent_days,
                'total_hours': round(total_secs / 3600.0, 2),
                'overtime_hours': round(overtime_secs / 3600.0, 2),
                'attendance_rate': attendance_rate,
            })
            
        serializer = MonthlyReportSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'total_employees': 0, 'present': 0, 'absent': 0, 'late': 0, 'on_time': 0, 'average_attendance_rate': 0.0})

        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        today = datetime.now().date()
        date_from = parse_date(date_from_str) if date_from_str else today
        date_to = parse_date(date_to_str) if date_to_str else today

        users_count = User.objects.filter(company=company, is_active=True).count()
        records = AttendanceRecord.objects.filter(
           company=company,
           date__gte=date_from, 
           date__lte=date_to,
           is_deleted=False
        )
        
        present = records.filter(status__in=['on_time', 'late', 'early_leave']).count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()
        on_time = records.filter(status='on_time').count()
        
        total_possible = users_count * ((date_to - date_from).days + 1)
        if total_possible == 0:
            total_possible = 1
        rate = round((present / total_possible) * 100, 2)
        
        data = {
            'total_employees': users_count,
            'present': present,
            'absent': absent,
            'late': late,
            'on_time': on_time,
            'average_attendance_rate': rate
        }
        return Response(SummaryReportSerializer(data).data)

    @action(detail=False, methods=['get'])
    def weekly(self, request):
        from datetime import timedelta
        today = datetime.now().date()
        start = today - timedelta(days=6)

        users = self._get_company_users(request)
        records = AttendanceRecord.objects.filter(
            company=request.user.company,
            date__gte=start,
            date__lte=today,
            is_deleted=False
        )

        data = []
        for single_date in (start + timedelta(n) for n in range(7)):
            day_records = records.filter(date=single_date)
            present = day_records.filter(status__in=['on_time', 'late', 'early_leave']).count()
            late = day_records.filter(status='late').count()
            absent = day_records.filter(status='absent').count()
            data.append({
                'date': single_date.strftime('%Y-%m-%d'),
                'day': single_date.strftime('%a'),
                'present': present,
                'late': late,
                'absent': absent,
            })

        return Response(data)

    @action(detail=False, methods=['get'], url_path='late-analysis')
    def late_analysis(self, request):
        month_str = request.query_params.get('month')
        if not month_str:
            return Response({'error': 'Month required (YYYY-MM)'}, status=400)
            
        try:
            year, month = map(int, month_str.split('-'))
            start_date = datetime(year, month, 1).date()
            _, last_day = calendar.monthrange(year, month)
            end_date = datetime(year, month, last_day).date()
        except Exception:
            return Response({'error': 'Invalid month format'}, status=400)
            
        records = AttendanceRecord.objects.filter(
            company=request.user.company,
            date__gte=start_date,
            date__lte=end_date,
            status='late',
            is_deleted=False
        ).values('user').annotate(
            late_count=Count('id'),
            total_late_minutes=Sum('late_seconds') / 60
        ).order_by('-late_count', '-total_late_minutes')[:10]
        
        data = []
        for r in records:
            u = User.objects.get(id=r['user'])
            department_name = getattr(u.department, 'name', None) if getattr(u, 'department', None) else None
            data.append({
                'user_id': u.id,
                'user_name': u.get_full_name(),
                'department': department_name,
                'late_count': r['late_count'],
                'total_late_minutes': int(r['total_late_minutes'] or 0)
            })
            
        return Response(LateAnalysisSerializer(data, many=True).data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        report_type = request.query_params.get('type', 'daily')
        export_format = request.query_params.get('export_format', 'csv')
        
        if report_type == 'monthly':
            if not request.query_params.get('month'):
                # supply a default for tests if needed
                q = request.GET.copy()
                q['month'] = datetime.now().strftime('%Y-%m')
                request.GET = q
            response = self.monthly(request)
        else:
            if not request.query_params.get('date'):
                q = request.GET.copy()
                q['date'] = str(datetime.now().date())
                request.GET = q
            response = self.daily(request)
            
        if response.status_code != 200:
            return response
            
        data = response.data
        
        if export_format == 'json':
            response = HttpResponse(json.dumps(data), content_type='application/json')
            response['Content-Disposition'] = f'attachment; filename="report_{report_type}.json"'
            return response
        else: # csv
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="report_{report_type}.csv"'
            
            if not data:
                return response
                
            writer = csv.writer(response)
            header = data[0].keys()
            writer.writerow(header)
            
            for row in data:
                writer.writerow([row.get(col, '') for col in header])
                
            return response
