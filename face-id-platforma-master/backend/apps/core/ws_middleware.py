"""
WebSocket JWT Authentication Middleware.

Reads ?token=<jwt> from the WebSocket URL query string,
validates it using SimpleJWT RS256, and sets scope['user'].
"""
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _get_user_from_token(token_str):
    from rest_framework_simplejwt.backends import TokenBackend
    from rest_framework_simplejwt.exceptions import TokenError
    from django.conf import settings
    from apps.accounts.models import User

    jwt_settings = settings.SIMPLE_JWT
    try:
        backend = TokenBackend(
            algorithm=jwt_settings.get('ALGORITHM', 'RS256'),
            signing_key=jwt_settings.get('SIGNING_KEY', ''),
            verifying_key=jwt_settings.get('VERIFYING_KEY', ''),
        )
        payload = backend.decode(token_str, verify=True)
        user_id = payload.get('user_id')
        if not user_id:
            return AnonymousUser()
        user = User.objects.select_related('company', 'role').get(id=user_id, is_active=True)
        return user
    except Exception:
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    ASGI middleware that authenticates WebSocket connections via
    ?token=<jwt> query parameter.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'websocket':
            query_string = scope.get('query_string', b'').decode()
            params = parse_qs(query_string)
            token_list = params.get('token', [])
            if token_list:
                scope['user'] = await _get_user_from_token(token_list[0])
            else:
                scope['user'] = AnonymousUser()
        return await self.app(scope, receive, send)


def JWTAuthMiddlewareStack(app):
    """Wrap app with JWTAuthMiddleware."""
    return JWTAuthMiddleware(app)
