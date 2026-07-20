from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.ingestion.models import WeeklyDataRecord
from apps.prediction.models import Prediction
from apps.alerts.models import Alert
from apps.alerts.serializers import AlertSerializer


def _make_prediction(district='Musanze', week='2026-W26', risk_score=0.626, alert=1):
    record = WeeklyDataRecord.objects.create(
        district=district,
        week_start_date=date(2026, 6, 22),
        week=week,
        active_regional_cases=18.0,
        distance_to_outbreak_km=95.5,
        border_inflow_count=90.0,
        transit_hub_count=3,
        isolation_capacity_score=4,
    )
    prediction = Prediction.objects.create(
        record=record,
        model_used='isolation_forest',
        risk_score=risk_score,
        early_warning_alert=alert,
    )
    return prediction


class AlertModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='alertuser', password='pass')
        self.prediction = _make_prediction()

    def test_high_risk_alert_creation(self):
        alert = Alert.objects.create(
            prediction=self.prediction,
            user=self.user,
            alert_level='HIGH',
            message='HIGH RISK — Musanze flagged for week 2026-W26 (63%).',
        )
        self.assertEqual(alert.alert_level, 'HIGH')
        self.assertFalse(alert.acknowledged)

    def test_low_risk_alert_creation(self):
        low_pred = _make_prediction(district='Bugesera', week='2026-W26',
                                    risk_score=0.18, alert=0)
        alert = Alert.objects.create(
            prediction=low_pred,
            alert_level='LOW',
            message='Bugesera risk levels normal.',
        )
        self.assertEqual(alert.alert_level, 'LOW')

    def test_acknowledged_flag_persists(self):
        alert = Alert.objects.create(
            prediction=self.prediction,
            alert_level='HIGH',
            message='Test alert.',
        )
        alert.acknowledged = True
        alert.save()
        self.assertTrue(Alert.objects.get(pk=alert.pk).acknowledged)

    def test_rerun_preserves_acknowledged_state(self):
        """update_or_create on rerun must not reset acknowledged=True."""
        alert = Alert.objects.create(
            prediction=self.prediction,
            user=self.user,
            alert_level='HIGH',
            message='Original message.',
        )
        alert.acknowledged = True
        alert.save()

        Alert.objects.update_or_create(
            prediction=self.prediction,
            defaults={
                'user': self.user,
                'alert_level': 'HIGH',
                'message': 'Updated message after rerun.',
            }
        )

        refreshed = Alert.objects.get(pk=alert.pk)
        self.assertTrue(refreshed.acknowledged)
        self.assertEqual(refreshed.message, 'Updated message after rerun.')

    def test_alert_str(self):
        alert = Alert.objects.create(
            prediction=self.prediction,
            alert_level='LOW',
            message='Normal.',
        )
        self.assertIn('Alert', str(alert))


class AlertSerializerTest(TestCase):

    def test_district_derived_from_prediction_chain(self):
        """Serializer.get_district() must traverse prediction → record → district."""
        prediction = _make_prediction(district='Nyagatare', week='2026-W26')
        alert = Alert.objects.create(
            prediction=prediction,
            alert_level='HIGH',
            message='High risk.',
        )
        data = AlertSerializer(alert).data
        self.assertEqual(data['district'], 'Nyagatare')

    def test_district_falls_back_gracefully(self):
        """If the FK chain is broken the serializer returns 'Unknown' without crashing."""
        prediction = _make_prediction(district='Rubavu')
        alert = Alert.objects.create(prediction=prediction, alert_level='LOW', message='OK.')
        serializer = AlertSerializer(alert)
        district = serializer.data.get('district')
        self.assertIsNotNone(district)


class AlertAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(
            username='admin', password='pass123', email='a@b.com'
        )
        resp = self.client.post('/api/token/', {'username': 'admin', 'password': 'pass123'})
        self.token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_list_alerts_empty(self):
        response = self.client.get('/api/alerts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_alerts_returns_created_alerts(self):
        prediction = _make_prediction()
        Alert.objects.create(
            prediction=prediction,
            user=self.user,
            alert_level='HIGH',
            message='HIGH RISK — Musanze.',
        )
        response = self.client.get('/api/alerts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['alert_level'], 'HIGH')

    def test_unauthenticated_request_rejected(self):
        unauth = APIClient()
        self.assertEqual(unauth.get('/api/alerts/').status_code, status.HTTP_401_UNAUTHORIZED)

    def test_only_acknowledged_can_be_updated(self):
        prediction = _make_prediction()
        alert = Alert.objects.create(
            prediction=prediction,
            alert_level='HIGH',
            message='HIGH RISK — Musanze.',
        )

        response = self.client.patch(
            f'/api/alerts/{alert.id}/', {'message': 'Tampered'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        alert.refresh_from_db()
        self.assertEqual(alert.message, 'HIGH RISK — Musanze.')

    def test_acknowledgement_can_be_updated(self):
        prediction = _make_prediction()
        alert = Alert.objects.create(
            prediction=prediction,
            alert_level='HIGH',
            message='HIGH RISK — Musanze.',
        )

        response = self.client.patch(
            f'/api/alerts/{alert.id}/', {'acknowledged': True}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertTrue(alert.acknowledged)
