import joblib
import numpy as np
import os
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prediction
from .serializers import PredictionSerializer
from apps.ingestion.models import WeeklyDataRecord

# Load models once at startup
BASE_DIR = settings.BASE_DIR
ML_DIR = os.path.join(BASE_DIR, 'ml_models')

def load_model(name):
    path = os.path.join(ML_DIR, f'{name}_model.pkl')
    return joblib.load(path) if os.path.exists(path) else None

MODELS = {
    'xgboost':       load_model('xgboost'),
    'random_forest': load_model('random_forest'),
    'decision_tree': load_model('decision_tree'),
    'svm':           load_model('svm'),
}
SCALER = joblib.load(os.path.join(ML_DIR, 'scaler.pkl')) \
         if os.path.exists(os.path.join(ML_DIR, 'scaler.pkl')) else None

FEATURES = [
    'ebola_cases', 'cases_lag_1wk', 'temperature',
    'rainfall', 'ndvi_value', 'transit_volume', 'transit_lag_1wk'
]

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

        records = WeeklyDataRecord.objects.order_by('-week_start_date')
        if district:
            records = records.filter(district=district)
        record = records.first()

        if not record:
            return Response(
                {'error': 'No weekly data records found'},
                status=status.HTTP_404_NOT_FOUND
            )

        features = np.array([[
            record.ebola_cases,
            record.cases_lag_1wk,
            record.temperature,
            record.rainfall,
            record.ndvi_value,
            record.transit_volume,
            record.transit_lag_1wk,
        ]])

        if SCALER:
            features = SCALER.transform(features)

        model = MODELS.get('xgboost')
        if not model:
            return Response(
                {'error': 'Model not found'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        alert_flag = int(model.predict(features)[0])
        risk_score = float(model.predict_proba(features)[0][1])

        prediction, _ = Prediction.objects.update_or_create(
            record=record,
            defaults={
                'model_used': 'xgboost',
                'risk_score': round(risk_score, 4),
                'early_warning_alert': alert_flag,
            }
        )

        return Response({
            'record_id': record.id,
            'district': record.district,
            'model_used': 'xgboost',
            'risk_score': round(risk_score, 4),
            'early_warning_alert': alert_flag,
            'alert_message': 'HIGH RISK — Early warning triggered' if alert_flag == 1 else 'LOW RISK — No alert',
            'predicted_at': prediction.predicted_at,
        })