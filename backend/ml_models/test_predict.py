"""
Standalone unit tests for ml_models/predict.py.

Run from the backend/ directory:
    python ml_models/test_predict.py          # print pass/fail
    pytest ml_models/test_predict.py -v       # verbose with pytest

These tests do not require Django — they exercise the feature engineering and
inference logic directly against the trained .pkl files.
"""
import sys
import unittest
from pathlib import Path

import pandas as pd

# Allow running from the backend/ directory
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml_models.predict import predict_risk, engineer_features  # noqa: E402

# Minimal set of districts — enough to produce a meaningful National_Weekly_Cases
DISTRICTS = ['Rubavu', 'Musanze', 'Kicukiro', 'Nyagatare', 'Bugesera']
COLUMNS = [
    'Week', 'District',
    'Active Regional Cases', 'Distance to Outbreak (km)',
    'Border Inflow Count', 'Transit Hub Count', 'Isolation Capacity Score',
]
WEEKS_HISTORY = ['2026-W20', '2026-W21', '2026-W22', '2026-W23', '2026-W24', '2026-W25']
WEEK_NEW = '2026-W26'


def _make_df(weeks, districts=None, cases=0.0):
    if districts is None:
        districts = DISTRICTS
    rows = [
        {
            'Week': w, 'District': d,
            'Active Regional Cases': cases,
            'Distance to Outbreak (km)': 100.0,
            'Border Inflow Count': 50.0,
            'Transit Hub Count': 2,
            'Isolation Capacity Score': 3,
        }
        for w in weeks for d in districts
    ]
    return pd.DataFrame(rows, columns=COLUMNS)


class TestEngineerFeatures(unittest.TestCase):

    def test_adds_required_columns(self):
        df = _make_df([WEEK_NEW])
        out = engineer_features(df)
        for col in ('Case_Trend', 'National_Weekly_Cases', 'Week_Number'):
            self.assertIn(col, out.columns, f"Missing column: {col}")

    def test_week_number_parsed_correctly(self):
        df = _make_df(['2026-W26'])
        out = engineer_features(df)
        self.assertTrue((out['Week_Number'] == 26).all())

    def test_national_weekly_cases_equals_district_sum(self):
        """National_Weekly_Cases must be the sum of Active Regional Cases across all districts."""
        df = _make_df([WEEK_NEW], cases=10.0)
        out = engineer_features(df)
        expected = 10.0 * len(DISTRICTS)
        self.assertTrue((out['National_Weekly_Cases'] == expected).all())

    def test_case_trend_is_zero_without_history(self):
        """Without prior weeks, diff() has no reference — fillna(0) applies."""
        df = _make_df([WEEK_NEW], cases=5.0)
        out = engineer_features(df, history=None)
        self.assertTrue((out['Case_Trend'] == 0).all())

    def test_history_rows_excluded_from_output(self):
        """When history is provided only new-week rows are returned."""
        history = _make_df(WEEKS_HISTORY)
        new_week = _make_df([WEEK_NEW])
        out = engineer_features(new_week, history=history)
        self.assertTrue((out['Week'] == WEEK_NEW).all())
        self.assertEqual(len(out), len(DISTRICTS))

    def test_case_trend_reflects_delta(self):
        history = _make_df(WEEKS_HISTORY, cases=10.0)
        new_week = _make_df([WEEK_NEW], cases=20.0)
        out = engineer_features(new_week, history=history)
        self.assertTrue((out['Case_Trend'] == 10.0).all())


class TestPredictRisk(unittest.TestCase):

    def _run(self, new_cases=0.0, history_cases=0.0):
        history = _make_df(WEEKS_HISTORY, cases=history_cases)
        new_week = _make_df([WEEK_NEW], cases=new_cases)
        return predict_risk(new_week, history=history)

    def test_output_columns_present(self):
        result = self._run()
        for col in ('Week', 'District', 'anomaly_label', 'risk_score'):
            self.assertIn(col, result.columns)

    def test_output_row_count_matches_districts(self):
        result = self._run()
        self.assertEqual(len(result), len(DISTRICTS))

    def test_risk_scores_bounded_zero_to_one(self):
        """Scores are clipped at the score_bounds range — must never exceed [0, 1]."""
        result = self._run()
        self.assertTrue((result['risk_score'] >= 0).all())
        self.assertTrue((result['risk_score'] <= 1).all())

    def test_anomaly_labels_binary(self):
        """IsolationForest outputs +1 (normal) or -1 (anomaly)."""
        result = self._run()
        self.assertTrue(set(result['anomaly_label'].unique()).issubset({1, -1}))

    def test_no_history_does_not_crash(self):
        """Single-week inference without any prior context must complete."""
        new_week = _make_df([WEEK_NEW])
        result = predict_risk(new_week, history=None)
        self.assertEqual(len(result), len(DISTRICTS))

    def test_extreme_case_count_scores_stay_bounded(self):
        """Very high anomalous inputs must not push risk_score above 1."""
        result = self._run(new_cases=99999.0, history_cases=0.0)
        self.assertTrue((result['risk_score'] <= 1).all())

    def test_zero_cases_scores_stay_bounded(self):
        """All-zero inputs (very normal) must not produce negative risk scores."""
        result = self._run(new_cases=0.0, history_cases=0.0)
        self.assertTrue((result['risk_score'] >= 0).all())

    def test_result_district_column_matches_input(self):
        result = self._run()
        self.assertEqual(set(result['District']), set(DISTRICTS))

    def test_result_week_matches_input(self):
        result = self._run()
        self.assertTrue((result['Week'] == WEEK_NEW).all())


if __name__ == '__main__':
    unittest.main(verbosity=2)
