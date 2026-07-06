import csv
from datetime import date
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.ingestion.models import WeeklyDataRecord

CSV_PATH = Path(settings.BASE_DIR).parent / "data" / "raw" / "ml_features_dataset.csv"


class Command(BaseCommand):
    help = "Load data/raw/ml_features_dataset.csv into WeeklyDataRecord for the Isolation Forest risk model"

    def handle(self, *args, **options):
        if not CSV_PATH.exists():
            self.stderr.write(self.style.ERROR(f"Dataset not found at {CSV_PATH}"))
            return

        count = 0
        with open(CSV_PATH, newline="") as f:
            for row in csv.DictReader(f):
                year, week_num = row["Week"].split("-W")
                week_start_date = date.fromisocalendar(int(year), int(week_num), 1)

                WeeklyDataRecord.objects.update_or_create(
                    district=row["District"],
                    week_start_date=week_start_date,
                    defaults={
                        "week": row["Week"],
                        "active_regional_cases": float(row["Active Regional Cases"]),
                        "distance_to_outbreak_km": float(row["Distance to Outbreak (km)"]),
                        "border_inflow_count": float(row["Border Inflow Count"]),
                        "transit_hub_count": int(row["Transit Hub Count"]),
                        "isolation_capacity_score": int(row["Isolation Capacity Score"]),
                    },
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Loaded {count} records from {CSV_PATH}"))
