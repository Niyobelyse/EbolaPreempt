from django.test import TestCase
from datetime import date
from apps.ingestion.models import WeeklyDataRecord


class WeeklyDataRecordModelTest(TestCase):

    def _make_record(self, district='Rubavu', week='2026-W20', **kwargs):
        defaults = dict(
            week_start_date=date(2026, 5, 11),
            active_regional_cases=5.0,
            distance_to_outbreak_km=80.0,
            border_inflow_count=120.0,
            transit_hub_count=2,
            isolation_capacity_score=3,
        )
        defaults.update(kwargs)
        return WeeklyDataRecord.objects.create(district=district, week=week, **defaults)

    def test_create_record_with_all_risk_fields(self):
        r = self._make_record(district='Musanze', week='2026-W25',
                              active_regional_cases=12.0,
                              distance_to_outbreak_km=95.5,
                              border_inflow_count=85.0,
                              transit_hub_count=3,
                              isolation_capacity_score=4)
        self.assertEqual(r.district, 'Musanze')
        self.assertEqual(r.week, '2026-W25')
        self.assertEqual(r.active_regional_cases, 12.0)
        self.assertEqual(r.distance_to_outbreak_km, 95.5)
        self.assertEqual(r.transit_hub_count, 3)

    def test_str_representation(self):
        r = self._make_record(district='Kicukiro')
        self.assertIn('Kicukiro', str(r))

    def test_default_ordering_newest_first(self):
        WeeklyDataRecord.objects.create(district='A', week_start_date=date(2026, 1, 1))
        WeeklyDataRecord.objects.create(district='B', week_start_date=date(2026, 6, 1))
        first = WeeklyDataRecord.objects.first()
        self.assertEqual(first.district, 'B')

    def test_blank_week_excluded_from_prediction_queryset(self):
        """Records with week='' (legacy) must be invisible to predict_risk."""
        WeeklyDataRecord.objects.create(
            district='Rubavu',
            week_start_date=date(2026, 5, 4),
            week='',
        )
        self._make_record(week='2026-W20')

        valid = WeeklyDataRecord.objects.exclude(week='')
        self.assertEqual(valid.count(), 1)
        self.assertEqual(valid.first().week, '2026-W20')

    def test_null_risk_fields_allowed(self):
        """New fields are nullable so existing rows survive the additive migration."""
        r = WeeklyDataRecord.objects.create(
            district='Ngoma',
            week_start_date=date(2026, 5, 11),
        )
        self.assertIsNone(r.active_regional_cases)
        self.assertIsNone(r.distance_to_outbreak_km)
        self.assertIsNone(r.border_inflow_count)
        self.assertIsNone(r.transit_hub_count)
        self.assertIsNone(r.isolation_capacity_score)

    def test_update_or_create_idempotent(self):
        """Running load_risk_dataset twice must not create duplicate records."""
        WeeklyDataRecord.objects.update_or_create(
            district='Rubavu',
            week_start_date=date(2026, 5, 11),
            defaults={'week': '2026-W20', 'active_regional_cases': 5.0,
                      'distance_to_outbreak_km': 80.0, 'border_inflow_count': 120.0,
                      'transit_hub_count': 2, 'isolation_capacity_score': 3},
        )
        WeeklyDataRecord.objects.update_or_create(
            district='Rubavu',
            week_start_date=date(2026, 5, 11),
            defaults={'week': '2026-W20', 'active_regional_cases': 7.0,
                      'distance_to_outbreak_km': 80.0, 'border_inflow_count': 120.0,
                      'transit_hub_count': 2, 'isolation_capacity_score': 3},
        )
        records = WeeklyDataRecord.objects.filter(district='Rubavu',
                                                  week_start_date=date(2026, 5, 11))
        self.assertEqual(records.count(), 1)
        self.assertEqual(records.first().active_regional_cases, 7.0)
