from pathlib import Path

import pandas as pd
import joblib

BASE_DIR = Path(__file__).resolve().parent
RAW_DATA_PATH = BASE_DIR.parent.parent / "data" / "raw" / "ml_features_dataset.csv"

scaler = joblib.load(BASE_DIR / "scaler.pkl")
raw_feature_cols = joblib.load(BASE_DIR / "feature_cols.pkl")
model = joblib.load(BASE_DIR / "isolation_forest_model.pkl")
model_feature_cols = joblib.load(BASE_DIR / "model_feature_cols.pkl")
score_min, score_max = joblib.load(BASE_DIR / "score_bounds.pkl")


def engineer_features(df, history=None):
    data = df.copy()
    if history is not None:
        data = pd.concat([history, data], ignore_index=True)
    data = data.sort_values(["District", "Week"]).reset_index(drop=True)

    # Without prior weeks for a district, diff() has nothing to compare against
    # and falls back to 0 (treated as "no change" rather than an error)
    data["Case_Trend"] = data.groupby("District")["Active Regional Cases"].diff().fillna(0)

    national_weekly = data.groupby("Week")["Active Regional Cases"].sum()
    data["National_Weekly_Cases"] = data["Week"].map(national_weekly)

    data["Week_Number"] = data["Week"].str.extract(r"W(\d+)").astype(int)

    if history is not None:
        new_weeks = df["Week"].unique()
        data = data[data["Week"].isin(new_weeks)].reset_index(drop=True)

    return data


def predict_risk(df, history=None):
    data = engineer_features(df, history)

    X_scaled = scaler.transform(data[raw_feature_cols])
    X_scaled = pd.DataFrame(X_scaled, columns=[f"{c}_scaled" for c in raw_feature_cols])
    X_scaled = X_scaled[model_feature_cols]

    anomaly_label = model.predict(X_scaled)
    anomaly_score = -model.decision_function(X_scaled)
    risk_score = ((anomaly_score - score_min) / (score_max - score_min)).clip(0, 1)

    result = data[["Week", "District"]].copy()
    result["anomaly_label"] = anomaly_label
    result["risk_score"] = risk_score
    return result


if __name__ == "__main__":
    sample = pd.read_csv(RAW_DATA_PATH)
    history = sample[sample["Week"] < "2026-W26"]
    new_week = sample[sample["Week"] == "2026-W26"]

    results = predict_risk(new_week, history=history)
    print(results.sort_values("risk_score", ascending=False).head(10))
