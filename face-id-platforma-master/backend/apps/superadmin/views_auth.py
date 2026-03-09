from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from .serializers import SALoginSerializer

# Custom Token that uses SA_JWT_SECRET
class SAToken(AccessToken):
    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        return token

    def sign(self):
        from rest_framework_simplejwt.backends import TokenBackend
        backend = TokenBackend(
            'HS256',
            signing_key=settings.SA_JWT_SECRET,
            verifying_key=settings.SA_JWT_SECRET,
        )
        return backend.encode(self.payload)

class SALoginView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = SALoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        token = SAToken.for_user(user)
        access = token.sign()
        
        return Response({
            "access": access,
            "user": {
                "id": str(user.id),
                "phone": user.phone,
                "is_superuser": True
            }
        })
