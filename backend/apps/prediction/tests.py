from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.ingestion.models import WeeklyDataRecord
from apps.prediction.models import Prediction
from apps.alerts.models import Alert


def _make_record(district='Rubavu', week='2026-W20', week_start_date=None, **kwargs):
    defaults = dict(
        active_regional_cases=5.0,
        distance_to_outbreak_km=80.0,
        border_inflow_count=120.0,
        transit_hub_count=2,
        isolation_capacity_score=3,
    )
    defaults.update(kwargs)
    return WeeklyDataRecord.objects.create(
        district=district,
        week=week,
        week_start_date=week_start_date or date(2026, 5, 11),
        **defaults,
    )


class PredictionModelTest(TestCase):

    def setUp(self):
        self.record = _make_record()

    def test_prediction_creation(self):
        pred = Prediction.objects.create(
            record=self.record,
            model_used='isolation_forest',
            risk_score=0.63,
            early_warning_alert=1,
        )
        self.assertEqual(pred.model_used, 'isolation_forest')
        self.assertEqual(pred.early_warning_alert, 1)
        self.assertAlmostEqual(pred.risk_score, 0.63)

    def test_prediction_str(self):
        pred = Prediction.objects.create(
            record=self.record,
            model_used='isolation_forest',
            risk_score=0.5,
            early_warning_alert=0,
        )
        self.assertIn('Prediction', str(pred))

    def test_one_prediction_per_record(self):
        """Prediction → WeeklyDataRecord is a OneToOneField — second create must fail."""
        Prediction.objects.create(
            record=self.record,
            model_used='isolation_forest',
            risk_score=0.5,
            early_warning_alert=0,
        )
        with self.assertRaises(Exception):
            Prediction.objects.create(
                record=self.record,
                model_used='isolation_forest',
                risk_score=0.7,
                early_warning_alert=1,
            )

    def test_alert_auto_created_on_high_risk(self):
        """One Alert is created per Prediction via update_or_create."""
        pred = Prediction.objects.create(
            record=self.record,
            model_used='isolation_forest',
            risk_score=0.63,
            early_warning_alert=1,
        )
        Alert.objects.update_or_create(
            prediction=pred,
            defaults={'alert_level': 'HIGH',
                      'message': 'HIGH RISK — Rubavu flagged (63%).'}
        )
        self.assertEqual(Alert.objects.filter(prediction=pred).count(), 1)
        self.assertEqual(Alert.objects.get(prediction=pred).alert_level, 'HIGH')


class PredictionAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username='testadmin', password='testpass123', email='test@test.com'
        )
        resp = self.client.post('/api/token/', {'username': 'testadmin', 'password': 'testpass123'})
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_latest_risk_returns_404_when_no_predictions_exist(self):
        response = self.client.get('/api/predictions/latest-risk/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('message', response.data)

    def test_latest_risk_filtered_by_district(self):
        response = self.client.get('/api/predictions/latest-risk/?district=Rubavu')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_run_prediction_returns_404_when_no_data_loaded(self):
        """Prediction endpoint must explain why it cannot run (no WeeklyDataRecord rows)."""
        response = self.client.post('/api/predictions/run/', {'district': 'Rubavu'},
                                    format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)

    def test_unauthenticated_run_rejected(self):
        unauth = APIClient()
        response = unauth.post('/api/predictions/run/', {'district': 'Rubavu'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_staff_user_cannot_run_prediction(self):
        user = User.objects.create_user(username='analyst', password='testpass123')
        client = APIClient()
        response = client.post(
            '/api/token/', {'username': 'analyst', 'password': 'testpass123'}
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

        response = client.post('/api/predictions/run/', {'district': 'Rubavu'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_prediction_records_are_read_only(self):
        response = self.client.post('/api/predictions/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_unauthenticated_latest_risk_rejected(self):
        unauth = APIClient()
        response = unauth.get('/api/predictions/latest-risk/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_predictions_list_authenticated(self):
        response = self.client.get('/api/predictions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_predictions_list_district_filter(self):
        response = self.client.get('/api/predictions/?district=Musanze')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
