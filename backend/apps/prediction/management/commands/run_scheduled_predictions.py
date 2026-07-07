from django.core.management.base import BaseCommand
from apps.ingestion.models import WeeklyDataRecord
from apps.prediction.services import run_prediction_for_district


class Command(BaseCommand):
    help = 'Run Isolation Forest predictions for all districts (scheduled weekly cron job)'

    def handle(self, *args, **options):
        districts = (
            WeeklyDataRecord.objects
            .exclude(district='')
            .values_list('district', flat=True)
            .distinct()
        )

        if not districts:
            self.stderr.write(self.style.ERROR('No districts found in the database.'))
            return

        self.stdout.write(f'Running predictions for {len(districts)} district(s)...')
        success, failed = 0, 0

        for district in districts:
            try:
                results = run_prediction_for_district(district=district)
                if results:
                    row = results[0]
                    level = 'HIGH' if row['early_warning_alert'] == 1 else 'LOW '
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [{level}] {district}: risk={round(row["risk_score"] * 100)}%'
                        )
                    )
                    success += 1
                else:
                    self.stderr.write(f'  [SKIP] {district}: no result returned')
                    failed += 1
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f'  [FAIL] {district}: {exc}'))
                failed += 1

        self.stdout.write(f'\nDone — {success} succeeded, {failed} failed.')
