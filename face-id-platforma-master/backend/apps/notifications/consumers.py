import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.company_id = str(self.user.company_id)
        self.user_id = str(self.user.id)
        
        self.company_group = f"company_{self.company_id}"
        self.user_group = f"user_{self.user_id}"

        # Join groups
        await self.channel_layer.group_add(self.company_group, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'company_group'):
            await self.channel_layer.group_discard(self.company_group, self.channel_name)
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def attendance_checkin(self, event):
        """
        Triggered when someone in the company checks in.
        """
        await self.send(text_data=json.dumps(event))

    async def notification_receive(self, event):
        """
        Triggered for personal notifications.
        """
        await self.send(text_data=json.dumps(event))
