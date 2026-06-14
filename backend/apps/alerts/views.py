from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Alert
from .serializers import AlertSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-sent_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]