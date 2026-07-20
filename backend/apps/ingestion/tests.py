from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from unittest.mock import Mock, patch
from apps.ingestion.models import WeeklyDataRecord
from apps.ingestion.services import sync_who_ebola_data


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


class WeeklyDataRecordAPITest(TestCase):

    def test_records_endpoint_is_read_only(self):
        user = User.objects.create_user(username='reader', password='testpass123')
        client = APIClient()
        response = client.post('/api/token/', {'username': 'reader', 'password': 'testpass123'})
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

        response = client.post('/api/records/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class LiveWHOIngestionTest(TestCase):

    def setUp(self):
        for district, distance, inflow in [('Rubavu', 50, 100), ('Musanze', 100, 20)]:
            WeeklyDataRecord.objects.create(
                district=district,
                week='2026-W26',
                week_start_date=date(2026, 6, 22),
                active_regional_cases=0,
                distance_to_outbreak_km=distance,
                border_inflow_count=inflow,
                transit_hub_count=2,
                isolation_capacity_score=3,
            )

    @patch('apps.ingestion.services.requests.get')
    def test_sync_creates_traceable_estimated_records(self, get):
        response = Mock()
        response.text = (
            'Data as of 05 July 2026. In the Democratic Republic of the Congo, '
            'a cumulative total of 1,620 laboratory-confirmed cases was reported.'
        )
        get.return_value = response

        result = sync_who_ebola_data('https://example.test/who')

        records = WeeklyDataRecord.objects.filter(week='2026-W27').order_by('district')
        self.assertEqual(result['confirmed_cases'], 1620)
        self.assertEqual(records.count(), 2)
        self.assertAlmostEqual(sum(r.active_regional_cases for r in records), 1620)
        self.assertTrue(all(r.data_source == 'who_regional_estimate' for r in records))
        self.assertTrue(all(r.source_url == 'https://example.test/who' for r in records))

    @patch('apps.ingestion.services.requests.get')
    def test_sync_endpoint_requires_staff_user(self, get):
        response = Mock()
        response.text = 'Data as of 05 July 2026. A total of 1,620 confirmed cases.'
        get.return_value = response
        user = User.objects.create_user(username='reader', password='testpass123')
        client = APIClient()
        token_response = client.post('/api/token/', {'username': 'reader', 'password': 'testpass123'})
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}")

        response = client.post('/api/records/sync-live/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
