import socket
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.devices.models import Device
from .serializers import DeviceSerializer, DeviceCreateSerializer
from apps.core.utils import get_request_company


def _tcp_ping(host: str, port: int, timeout: float = 3.0) -> bool:
    """Try opening a TCP socket to host:port. Returns True if successful."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


class DeviceViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        company = get_request_company(self.request)
        if not company:
            return Device.objects.none()
        qs = Device.objects.filter(company=company)
        device_type = self.request.query_params.get('device_type')
        if device_type:
            qs = qs.filter(device_type=device_type)
        return qs

    def perform_create(self, serializer):
        company = get_request_company(self.request)
        if not company:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Kompaniyangiz yo'q.")
        serializer.save(company=company)

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DeviceCreateSerializer
        return DeviceSerializer

    @action(detail=True, methods=['get'], url_path='logs')
    def logs(self, request, pk=None):
        """Return face attempt logs for this device."""
        from apps.face.models import FaceAttempt
        device = self.get_object()
        qs = FaceAttempt.objects.filter(device=device).select_related('user').order_by('-created_at')[:500]
        data = []
        for a in qs:
            u = a.user
            data.append({
                'id': str(a.id),
                'user_id': str(u.id) if u else None,
                'user_name': (u.get_full_name() or u.phone) if u else None,
                'user_phone': u.phone if u else None,
                'distance': round(float(a.distance), 4),
                'success': a.success,
                'created_at': a.created_at.isoformat(),
            })
        return Response({'count': len(data), 'results': data})

    @action(detail=True, methods=['post'], url_path='test-connection')
    def test_connection(self, request, pk=None):
        """Test TCP connection to device IP:port and update connection_status."""
        device = self.get_object()
        if not device.ip_address:
            return Response(
                {'success': False, 'detail': 'IP manzil kiritilmagan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        port = device.port or (554 if device.device_type == 'camera' else 80)
        reachable = _tcp_ping(device.ip_address, port)
        device.connection_status = 'online' if reachable else 'offline'
        device.last_ping = timezone.now()
        device.save(update_fields=['connection_status', 'last_ping'])
        return Response({
            'success': reachable,
            'connection_status': device.connection_status,
            'last_ping': device.last_ping,
            'detail': 'Ulanish muvaffaqiyatli.' if reachable else f'{device.ip_address}:{port} ga ulanib bo\'lmadi.',
        })
