from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WeeklyDataRecord
from .serializers import WeeklyDataRecordSerializer


class WeeklyDataRecordViewSet(viewsets.ModelViewSet):
    queryset = WeeklyDataRecord.objects.all().order_by('-week_start_date')
    serializer_class = WeeklyDataRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(district=district)
        return queryset

    @action(detail=False, methods=['get'], url_path='districts')
    def districts(self, request):
        """Return a sorted list of distinct districts that have data."""
        districts = (
            WeeklyDataRecord.objects.values_list('district', flat=True)
            .distinct()
            .order_by('district')
        )
        return Response(sorted(set(districts)))