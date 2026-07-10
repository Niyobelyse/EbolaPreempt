import pandas as pd
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prediction
from .serializers import PredictionSerializer
from .services import run_prediction_for_district

class PredictionViewSet(viewsets.ModelViewSet):
    queryset = Prediction.objects.all().order_by('-predicted_at')
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(record__district=district)
        return queryset

    @action(detail=False, methods=['get'], url_path='latest-risk')
    def latest_risk(self, request):
        district = request.query_params.get('district')
        predictions = Prediction.objects.order_by('-predicted_at')
        if district:
            predictions = predictions.filter(record__district=district)
        prediction = predictions.first()

        if not prediction:
            return Response(
                {'message': 'No predictions yet'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(prediction)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='run-all')
    def run_all_predictions(self, request):
        """Run predictions for every district at once (used by the weekly cron job)."""
        from apps.ingestion.models import WeeklyDataRecord
        districts = (
            WeeklyDataRecord.objects
            .exclude(district='')
            .values_list('district', flat=True)
            .distinct()
        )
        results, errors = [], []
        for district in districts:
            try:
                rows = run_prediction_for_district(
                    district=district,
                    user=request.user if request.user.is_authenticated else None,
                )
                results.extend(rows)
            except Exception as exc:
                errors.append({'district': district, 'error': str(exc)})

        return Response({'results': results, 'errors': errors})

    @action(detail=False, methods=['get'], url_path='backtest')
    def backtest(self, request):
        """
        Leave-One-Week-Out backtest. Trains a fresh Isolation Forest on 6 of the
        7 available weeks and predicts the held-out week. Repeated for all 7 weeks.
        Returns per-prediction results and aggregate metrics.
        """
        from apps.ingestion.models import WeeklyDataRecord
        from ml_models.backtest import run_backtest
        from .services import RISK_FIELD_COLUMNS

        records = WeeklyDataRecord.objects.exclude(week='').order_by('week_start_date')
        if not records.exists():
            return Response(
                {'error': 'No weekly data loaded. Run load_risk_dataset first.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        df = pd.DataFrame.from_records(records.values(*RISK_FIELD_COLUMNS.keys()))
        df = df.rename(columns=RISK_FIELD_COLUMNS)

        result = run_backtest(df)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)

    @action(detail=False, methods=['post'], url_path='run')
    def run_prediction(self, request):
        district = request.data.get('district')
        try:
            results = run_prediction_for_district(
                district=district,
                user=request.user if request.user.is_authenticated else None,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

        if not results:
            return Response(
                {'error': 'No prediction could be generated for the latest week'},
                status=status.HTTP_404_NOT_FOUND,
            )

        row = results[0]
        return Response({
            'district': row['district'],
            'model_used': 'isolation_forest',
            'risk_score': row['risk_score'],
            'early_warning_alert': row['early_warning_alert'],
            'alert_message': (
                'HIGH RISK — Early warning triggered'
                if row['early_warning_alert'] == 1
                else 'LOW RISK — No alert'
            ),
            'predicted_at': row['predicted_at'],
        })