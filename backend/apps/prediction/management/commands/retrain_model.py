"""Retrain the deployed Isolation Forest from stored weekly risk records."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from django.core.management.base import BaseCommand, CommandError
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from apps.ingestion.models import WeeklyDataRecord
from apps.prediction.services import RISK_FIELD_COLUMNS
from ml_models.predict import engineer_features


MODELS_DIR = Path(__file__).resolve().parents[4] / 'ml_models'
RAW_FEATURE_COLUMNS = [
    'Active Regional Cases',
    'Distance to Outbreak (km)',
    'Border Inflow Count',
    'Isolation Capacity Score',
    'Case_Trend',
    'National_Weekly_Cases',
    'Week_Number',
]


def _atomic_dump(value, path):
    temporary = path.with_suffix(f'{path.suffix}.tmp')
    joblib.dump(value, temporary)
    os.replace(temporary, path)


class Command(BaseCommand):
    help = 'Retrain Isolation Forest artifacts from all stored weekly risk records.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--seeded-only',
            action='store_true',
            help='Exclude WHO regional-estimate records from the training data.',
        )

    def handle(self, *args, **options):
        records = WeeklyDataRecord.objects.exclude(week='').order_by('week_start_date', 'district')
        if options['seeded_only']:
            records = records.filter(data_source='seeded_dataset')

        values = list(records.values(*RISK_FIELD_COLUMNS.keys(), 'data_source'))
        if not values:
            raise CommandError('No weekly risk records are available for training.')

        df = pd.DataFrame.from_records(values)
        df = df.rename(columns=RISK_FIELD_COLUMNS)
        if df['Week'].nunique() < 3:
            raise CommandError('At least three weekly observations are required to retrain the model.')
        if df[RAW_FEATURE_COLUMNS[:4]].isnull().any().any():
            raise CommandError('Training data contains missing model features.')

        engineered = engineer_features(df)
        scaler = StandardScaler()
        scaled = scaler.fit_transform(engineered[RAW_FEATURE_COLUMNS])
        model_feature_columns = [f'{column}_scaled' for column in RAW_FEATURE_COLUMNS]
        model_input = pd.DataFrame(scaled, columns=model_feature_columns)

        model = IsolationForest(n_estimators=200, contamination=0.1, random_state=42)
        model.fit(model_input)
        scores = -model.decision_function(model_input)
        score_bounds = (float(scores.min()), float(scores.max()))

        MODELS_DIR.mkdir(parents=True, exist_ok=True)
        _atomic_dump(scaler, MODELS_DIR / 'scaler.pkl')
        _atomic_dump(RAW_FEATURE_COLUMNS, MODELS_DIR / 'feature_cols.pkl')
        _atomic_dump(model, MODELS_DIR / 'isolation_forest_model.pkl')
        _atomic_dump(model_feature_columns, MODELS_DIR / 'model_feature_cols.pkl')
        _atomic_dump(score_bounds, MODELS_DIR / 'score_bounds.pkl')

        source_counts = df['data_source'].value_counts().to_dict()
        metadata = {
            'trained_at': datetime.now(timezone.utc).isoformat(),
            'algorithm': 'IsolationForest',
            'n_estimators': 200,
            'contamination': 0.1,
            'random_state': 42,
            'training_rows': len(df),
            'training_weeks': sorted(df['Week'].unique().tolist()),
            'source_counts': source_counts,
            'feature_columns': RAW_FEATURE_COLUMNS,
            'score_bounds': score_bounds,
        }
        (MODELS_DIR / 'training_metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')

        self.stdout.write(self.style.SUCCESS(
            f"Retrained Isolation Forest with {len(df)} records across {df['Week'].nunique()} weeks."
        ))
        self.stdout.write(f"Sources: {source_counts}")
