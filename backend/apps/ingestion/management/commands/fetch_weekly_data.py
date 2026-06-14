from django.core.management.base import BaseCommand
from datetime import datetime, timedelta
from apps.ingestion.models import WeeklyDataRecord
from apps.ingestion.services import (
    DISTRICT_COORDINATES,
    fetch_weather_data,
    fetch_hdx_case_data,
    fetch_mobility_data,
)


class Command(BaseCommand):
    help = "Fetch weekly Ebola, weather, and mobility data for all tracked districts"

    def add_arguments(self, parser):
        parser.add_argument(
            '--week-start',
            type=str,
            help='Week start date in YYYY-MM-DD format. Defaults to most recent Monday.',
        )
        parser.add_argument(
            '--district',
            type=str,
            help='Fetch data for a single district only (e.g. Rubavu). Defaults to all districts.',
        )

    def handle(self, *args, **options):
        if options['week_start']:
            week_start = datetime.strptime(options['week_start'], '%Y-%m-%d').date()
        else:
            today = datetime.now().date()
            week_start = today - timedelta(days=today.weekday())

        week_end = week_start + timedelta(days=6)

        if options['district']:
            coords = DISTRICT_COORDINATES.get(options['district'])
            if coords is None:
                self.stderr.write(self.style.ERROR(
                    f"Unknown district '{options['district']}'. "
                    f"Available: {', '.join(DISTRICT_COORDINATES.keys())}"
                ))
                return
            districts = {options['district']: coords}
        else:
            districts = DISTRICT_COORDINATES

        self.stdout.write(f"Fetching data for week {week_start} to {week_end}...")
        self.stdout.write(f"Districts: {', '.join(districts.keys())}\n")

        hdx = fetch_hdx_case_data()
        self.stdout.write(f"HDX: {hdx}\n")

        previous_week = week_start - timedelta(days=7)

        for district_name, coords in districts.items():
            self.stdout.write(f"--- {district_name} ---")

            weather = fetch_weather_data(
                coords["lat"], coords["lon"],
                week_start.isoformat(), week_end.isoformat(),
            )
            self.stdout.write(f"  Weather: {weather}")

            mobility = fetch_mobility_data(district_name)
            self.stdout.write(f"  Mobility: {mobility}")

            previous_record = WeeklyDataRecord.objects.filter(
                district=district_name,
                week_start_date=previous_week
            ).first()

            cases_lag_1wk = previous_record.ebola_cases if previous_record else 0
            transit_lag_1wk = previous_record.transit_volume if previous_record else 0

            ndvi_value = 0.6

            record, created = WeeklyDataRecord.objects.update_or_create(
                district=district_name,
                week_start_date=week_start,
                defaults={
                    'ebola_cases': hdx['ebola_cases'],
                    'cases_lag_1wk': cases_lag_1wk,
                    'temperature': weather['temperature'],
                    'rainfall': weather['rainfall'],
                    'ndvi_value': ndvi_value,
                    'transit_volume': mobility['transit_volume'],
                    'transit_lag_1wk': transit_lag_1wk,
                }
            )

            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(
                f"  {action} record (id={record.id}) for {district_name} - {week_start}\n"
            ))
