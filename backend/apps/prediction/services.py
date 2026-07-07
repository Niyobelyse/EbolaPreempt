import pandas as pd

from apps.ingestion.models import WeeklyDataRecord
from apps.alerts.models import Alert
from ml_models.predict import predict_risk
from .models import Prediction

RISK_FIELD_COLUMNS = {
    'week': 'Week',
    'district': 'District',
    'active_regional_cases': 'Active Regional Cases',
    'distance_to_outbreak_km': 'Distance to Outbreak (km)',
    'border_inflow_count': 'Border Inflow Count',
    'transit_hub_count': 'Transit Hub Count',
    'isolation_capacity_score': 'Isolation Capacity Score',
}


def run_prediction_for_district(district=None, user=None):
    """
    Run the Isolation Forest prediction for one district (or all districts if
    district=None).  Returns a list of result dicts, one per district processed.
    Raises ValueError if there is no weekly data to run against.
    """
    records = WeeklyDataRecord.objects.exclude(week='').order_by('week_start_date')
    if not records.exists():
        raise ValueError('No weekly risk data found. Run load_risk_dataset first.')

    df = pd.DataFrame.from_records(records.values(*RISK_FIELD_COLUMNS.keys()))
    df = df.rename(columns=RISK_FIELD_COLUMNS)

    latest_week = df['Week'].max()
    new_week = df[df['Week'] == latest_week]
    history = df[df['Week'] < latest_week]

    results = predict_risk(new_week, history=history if not history.empty else None)
    if district:
        results = results[results['District'] == district]

    if results.empty:
        raise ValueError(f'No prediction generated for {district or "any district"}')

    output = []
    for _, row in results.iterrows():
        record = records.filter(district=row['District'], week=row['Week']).first()
        if record is None:
            continue

        alert_flag = int(row['anomaly_label'] == -1)
        risk_score = float(row['risk_score'])

        prediction, _ = Prediction.objects.update_or_create(
            record=record,
            defaults={
                'model_used': 'isolation_forest',
                'risk_score': round(risk_score, 4),
                'early_warning_alert': alert_flag,
            },
        )

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
                'user': user,
                'alert_level': alert_level,
                'message': message,
            },
        )

        output.append({
            'district': record.district,
            'risk_score': round(risk_score, 4),
            'early_warning_alert': alert_flag,
            'predicted_at': prediction.predicted_at,
        })

    return output
