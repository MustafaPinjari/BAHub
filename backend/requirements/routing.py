from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/projects/(?P<project_id>[^/]+)/requirements/$", consumers.RequirementConsumer.as_asgi()),
]
