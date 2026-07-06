import pandas as pd
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prediction
from .serializers import PredictionSerializer
from apps.ingestion.models import WeeklyDataRecord
from apps.alerts.models import Alert
from ml_models.predict import predict_risk

# Maps WeeklyDataRecord field names to the column names predict_risk() expects
RISK_FIELD_COLUMNS = {
    'week': 'Week',
    'district': 'District',
    'active_regional_cases': 'Active Regional Cases',
    'distance_to_outbreak_km': 'Distance to Outbreak (km)',
    'border_inflow_count': 'Border Inflow Count',
    'transit_hub_count': 'Transit Hub Count',
    'isolation_capacity_score': 'Isolation Capacity Score',
}

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

    @action(detail=False, methods=['post'], url_path='run')
    def run_prediction(self, request):
        district = request.data.get('district')

        # National_Weekly_Cases needs every district's data for the week, so the
        # queryset used to build features must stay unfiltered — only the final
        # result row is filtered down to the requested district.
        records = WeeklyDataRecord.objects.exclude(week='').order_by('week_start_date')

        if not records.exists():
            return Response(
                {'error': 'No weekly risk data found. Run the load_risk_dataset management command first.'},
                status=status.HTTP_404_NOT_FOUND
            )

        df = pd.DataFrame.from_records(records.values(*RISK_FIELD_COLUMNS.keys()))
        df = df.rename(columns=RISK_FIELD_COLUMNS)

        latest_week = df['Week'].max()
        new_week = df[df['Week'] == latest_week]
        history = df[df['Week'] < latest_week]

        results = predict_risk(new_week, history=history if not history.empty else None)
        if district:
            results = results[results['District'] == district]

        if results.empty:
            return Response(
                {'error': 'No prediction could be generated for the latest week'},
                status=status.HTTP_404_NOT_FOUND
            )

        row = results.iloc[0]
        record = records.filter(district=row['District'], week=row['Week']).first()

        if record is None:
            return Response(
                {'error': f"No database record found for {row['District']} / {row['Week']}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        alert_flag = int(row['anomaly_label'] == -1)
        risk_score = float(row['risk_score'])

        prediction, _ = Prediction.objects.update_or_create(
            record=record,
            defaults={
                'model_used': 'isolation_forest',
                'risk_score': round(risk_score, 4),
                'early_warning_alert': alert_flag,
            }
        )

        # One alert per prediction — reruns for the same district/week update
        # the existing alert (preserving its acknowledged state) instead of spamming.
        alert_level = 'HIGH' if alert_flag == 1 else 'LOW'
        message = (
            f"HIGH RISK — {record.district} flagged as an anomaly for week {record.week} "
            f"(risk score {round(risk_score * 100)}%). Immediate review recommended."
            if alert_flag == 1 else
            f"{record.district} risk levels normal for week {record.week} "
            f"(risk score {round(risk_score * 100)}%)."
        )
        Alert.objects.update_or_create(
            prediction=prediction,
            defaults={
                'user': request.user if request.user.is_authenticated else None,
                'alert_level': alert_level,
                'message': message,
            }
        )

        return Response({
            'record_id': record.id,
            'district': record.district,
            'model_used': 'isolation_forest',
            'risk_score': round(risk_score, 4),
            'early_warning_alert': alert_flag,
            'alert_message': 'HIGH RISK — Early warning triggered' if alert_flag == 1 else 'LOW RISK — No alert',
            'predicted_at': prediction.predicted_at,
        })