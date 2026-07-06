from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Alert
from .serializers import AlertSerializer


class AlertViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only + partial-update (acknowledge) only. Create/delete go through run_prediction."""
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = Alert.objects.all().order_by('-sent_at')
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(prediction__record__district=district)
        return queryset