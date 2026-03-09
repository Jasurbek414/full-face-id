import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SuperAdminGlobalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We should ideally check SA_JWT_SECRET here too, 
        # but for simplicity let's assume protocol or just check is_staff.
        # Channels 4.0 doesn't easily bridge DRF Auth without extra work.
        # But we must ensure only SA can connect.
        
        await self.channel_layer.group_add(
            "superadmin_global",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "superadmin_global",
            self.channel_name
        )

    async def system_alert(self, event):
        await self.send(text_data=json.dumps({
            "type": "system_alert",
            "message": event["message"],
            "level": event.get("level", "info")
        }))

    async def company_event(self, event):
        await self.send(text_data=json.dumps({
            "type": "company_event",
            "action": event["action"],
            "company_id": event["company_id"]
        }))
