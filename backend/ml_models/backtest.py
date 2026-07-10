"""
Leave-One-Week-Out backtesting for the Isolation Forest early warning model.

For each of the 7 held-out weeks:
  - Train a fresh IsolationForest + StandardScaler on the remaining 6 weeks
  - Predict risk scores for all 30 districts in the held-out week
  - Compare predictions against actual Active Regional Cases as proxy ground truth

Metrics:
  - Spearman rank correlation (risk_score vs actual_cases)
  - Precision@5: top-5 highest-risk districts overlap with top-5 by actual cases
  - Mean risk for weeks with cases > 0 vs weeks with zero cases
"""

import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    "Active Regional Cases",
    "Distance to Outbreak (km)",
    "Border Inflow Count",
    "Isolation Capacity Score",
    "Case_Trend",
    "National_Weekly_Cases",
    "Week_Number",
]


def _engineer(df):
    data = df.copy().sort_values(["District", "Week"]).reset_index(drop=True)
    data["Case_Trend"] = (
        data.groupby("District")["Active Regional Cases"].diff().fillna(0)
    )
    national = data.groupby("Week")["Active Regional Cases"].sum()
    data["National_Weekly_Cases"] = data["Week"].map(national)
    data["Week_Number"] = data["Week"].str.extract(r"W(\d+)").astype(int)
    return data


def run_backtest(df):
    """
    df: DataFrame with columns Week, District, Active Regional Cases,
        Distance to Outbreak (km), Border Inflow Count, Isolation Capacity Score.
    Returns a dict with aggregate metrics and per-prediction results.
    """
    weeks = sorted(df["Week"].unique())
    if len(weeks) < 3:
        return {"error": "Need at least 3 weeks of data to run backtest."}

    all_rows = []

    for held_out in weeks:
        train_raw = df[df["Week"] != held_out].copy()
        combined = pd.concat([train_raw, df[df["Week"] == held_out]], ignore_index=True)

        train_eng = _engineer(train_raw)
        full_eng = _engineer(combined)
        test_eng = full_eng[full_eng["Week"] == held_out].copy()

        X_train = train_eng[FEATURE_COLS].fillna(0).values
        X_test = test_eng[FEATURE_COLS].fillna(0).values

        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        clf = IsolationForest(n_estimators=200, contamination=0.1, random_state=42)
        clf.fit(X_train_s)

        # Anomaly score: higher = more anomalous = higher risk
        train_scores = -clf.decision_function(X_train_s)
        test_scores = -clf.decision_function(X_test_s)

        s_min, s_max = train_scores.min(), train_scores.max()
        if s_max > s_min:
            risk = ((test_scores - s_min) / (s_max - s_min)).clip(0, 1)
        else:
            risk = np.zeros(len(test_scores))

        flags = (clf.predict(X_test_s) == -1).astype(int)

        for i, (_, row) in enumerate(test_eng.iterrows()):
            all_rows.append(
                {
                    "district": row["District"],
                    "week": held_out,
                    "risk_score": round(float(risk[i]), 4),
                    "anomaly_flag": int(flags[i]),
                    "actual_cases": int(row["Active Regional Cases"]),
                }
            )

    res = pd.DataFrame(all_rows)

    corr, pval = spearmanr(res["risk_score"], res["actual_cases"])

    precision_scores = []
    for w in weeks:
        wdf = res[res["week"] == w]
        top_risk = set(wdf.nlargest(5, "risk_score")["district"])
        top_cases = set(wdf.nlargest(5, "actual_cases")["district"])
        precision_scores.append(len(top_risk & top_cases) / 5)

    has_cases = res[res["actual_cases"] > 0]["risk_score"]
    no_cases = res[res["actual_cases"] == 0]["risk_score"]

    return {
        "method": "Leave-One-Week-Out",
        "total_folds": len(weeks),
        "weeks_backtested": weeks,
        "total_predictions": len(res),
        "spearman_correlation": round(float(corr), 4),
        "spearman_p_value": round(float(pval), 4),
        "precision_at_5": round(float(np.mean(precision_scores)), 4),
        "mean_risk_cases_gt_0": round(float(has_cases.mean()), 4) if len(has_cases) else None,
        "mean_risk_cases_eq_0": round(float(no_cases.mean()), 4) if len(no_cases) else None,
        "results": (
            res.sort_values(["week", "risk_score"], ascending=[True, False])
            .to_dict(orient="records")
        ),
    }
