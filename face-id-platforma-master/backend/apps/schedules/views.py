from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import WorkSchedule, UserSchedule, ShiftTemplate
from .serializers import WorkScheduleSerializer, UserScheduleSerializer, ShiftTemplateSerializer
from .services import get_user_schedule, get_company_now
from apps.core.utils import get_request_company

class WorkScheduleViewSet(viewsets.ModelViewSet):
    queryset = WorkSchedule.objects.all()
    serializer_class = WorkScheduleSerializer

    def get_queryset(self):
        company = get_request_company(self.request)
        if not company:
            return self.queryset.none()
        return self.queryset.filter(company=company)

    def perform_create(self, serializer):
        company = get_request_company(self.request)
        if not company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Kompaniyangiz yo'q.")
        serializer.save(company=company)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        schedule = self.get_object()
        user_id = request.data.get('user_id')
        effective_from = request.data.get('effective_from')
        effective_to = request.data.get('effective_to')

        if not user_id or not effective_from:
            return Response(
                {'error': 'user_id and effective_from are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_schedule = UserSchedule.objects.create(
            user_id=user_id,
            company=request.user.company,
            schedule=schedule,
            effective_from=effective_from,
            effective_to=effective_to
        )
        serializer = UserScheduleSerializer(user_schedule)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my(self, request):
        now = get_company_now(request.user.company)
        schedule = get_user_schedule(request.user, now.date())
        if schedule:
            serializer = WorkScheduleSerializer(schedule)
            return Response(serializer.data)
        return Response({'detail': 'No active schedule found for today'}, status=status.HTTP_404_NOT_FOUND)

class ShiftTemplateViewSet(viewsets.ModelViewSet):
    queryset = ShiftTemplate.objects.all()
    serializer_class = ShiftTemplateSerializer

    def get_queryset(self):
        company = get_request_company(self.request)
        if not company:
            return self.queryset.none()
        return self.queryset.filter(company=company)

    def perform_create(self, serializer):
        company = get_request_company(self.request)
        if not company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Kompaniyangiz yo'q.")
        serializer.save(company=company)
