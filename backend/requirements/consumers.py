import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from projects.models import Project

User = get_user_model()

class RequirementConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # 1. Authenticate via token query param
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])
        
        if not token_list:
            await self.close(code=4001)  # Unauthorized
            return
            
        token = token_list[0]
        try:
            # Parse JWT token
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            self.user = await self.get_user(user_id)
        except Exception:
            await self.close(code=4001)  # Invalid token
            return

        if not self.user:
            await self.close(code=4001)
            return

        # 2. Check project scoping & tenant organization
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.project = await self.get_project(self.project_id)
        
        if not self.project:
            await self.close(code=4004)  # Project not found
            return
            
        # Ensure project organization matches user organization
        if not self.user.organization_id or self.project.organization_id != self.user.organization_id:
            await self.close(code=4003)  # Forbidden
            return

        self.group_name = f"project_{self.project_id}_requirements"

        # 3. Join project group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # 4. Broadcast connection presence
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "presence.update",
                "user": self.user.username,
                "status": "online",
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            # Broadcast offline presence
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "presence.update",
                    "user": self.user.username,
                    "status": "offline",
                }
            )
            # Leave project group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except Exception:
            return
            
        action_type = data.get("type")

        if action_type == "typing":
            req_id = data.get("requirement_id")
            is_typing = data.get("is_typing", False)
            
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "requirement.typing",
                    "user": self.user.username,
                    "requirement_id": req_id,
                    "is_typing": is_typing,
                }
            )

    # Group message handlers
    async def requirement_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "requirement.update",
            "action": event["action"],
            "requirement_id": event["requirement_id"],
            "user": event["user"],
        }))

    async def requirement_typing(self, event):
        # Don't send typing notices back to the typing user
        if event["user"] != self.user.username:
            await self.send(text_data=json.dumps({
                "type": "requirement.typing",
                "user": event["user"],
                "requirement_id": event["requirement_id"],
                "is_typing": event["is_typing"],
            }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence",
            "user": event["user"],
            "status": event["status"],
        }))

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def get_project(self, project_id):
        try:
            return Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return None
