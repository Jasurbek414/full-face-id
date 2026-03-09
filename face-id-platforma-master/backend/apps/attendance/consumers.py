import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class AttendanceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint: ws/attendance/?token=<jwt>
    Authenticated via token query param (JWT middleware).
    Sends live attendance updates to connected clients.
    """

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        company = await self._get_company(user)
        if not company:
            await self.close(code=4002)
            return

        self.company_id = str(company.id)
        self.group_name = f"attendance_{self.company_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send today's live snapshot on connect
        snapshot = await self._get_live_snapshot(company)
        await self.send(text_data=json.dumps({'type': 'snapshot', 'data': snapshot}))

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Client may send ping; ignore otherwise
        pass

    async def attendance_update(self, event):
        """Called when group_send is used to broadcast attendance updates."""
        await self.send(text_data=json.dumps({'type': 'update', 'data': event.get('data', {})}))

    @database_sync_to_async
    def _get_company(self, user):
        return getattr(user, 'company', None)

    @database_sync_to_async
    def _get_live_snapshot(self, company):
        from apps.attendance.models import AttendanceRecord
        today = timezone.now().date()
        qs = AttendanceRecord.objects.filter(
            company=company,
            date=today,
            check_in__isnull=False,
            is_deleted=False,
        ).select_related('user')[:50]
        result = []
        for r in qs:
            result.append({
                'id': str(r.id),
                'user_name': r.user.get_full_name() or r.user.phone,
                'user_photo': None,
                'check_in': r.check_in.isoformat() if r.check_in else None,
                'check_out': r.check_out.isoformat() if r.check_out else None,
                'status': r.status,
                'check_in_method': r.check_in_method,
            })
        return result
