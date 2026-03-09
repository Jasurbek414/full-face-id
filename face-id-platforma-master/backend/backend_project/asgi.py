import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from backend_project.routing import websocket_urlpatterns  # noqa: E402
from apps.core.ws_middleware import JWTAuthMiddlewareStack  # noqa: E402

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
