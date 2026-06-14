import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb
import joblib
import os

#  1. Generate sample training data 
np.random.seed(42)
n = 60  # 60 weekly records

data = {
    'ebola_cases':     np.random.randint(0, 50, n),
    'cases_lag_1wk':   np.random.randint(0, 50, n),
    'temperature':     np.random.uniform(18, 32, n),
    'rainfall':        np.random.uniform(0, 120, n),
    'ndvi_value':      np.random.uniform(0.1, 0.8, n),
    'transit_volume':  np.random.randint(30000, 50000, n),
    'transit_lag_1wk': np.random.randint(30000, 50000, n),
}

df = pd.DataFrame(data)

# Target: high risk if cases > 20 and transit > 40000
df['early_warning_alert'] = (
    (df['ebola_cases'] > 20) & 
    (df['transit_volume'] > 40000)
).astype(int)

print(f"Dataset shape: {df.shape}")
print(f"Alert distribution:\n{df['early_warning_alert'].value_counts()}")

#  2. Features and target 
FEATURES = [
    'ebola_cases', 'cases_lag_1wk', 'temperature',
    'rainfall', 'ndvi_value', 'transit_volume', 'transit_lag_1wk'
]

X = df[FEATURES]
y = df['early_warning_alert']

#  3. Scale features 
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

#  4. Train test split 
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

#  5. Train all 4 models 
models = {
    'xgboost': xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    ),
    'random_forest': RandomForestClassifier(
        n_estimators=100,
        random_state=42
    ),
    'decision_tree': DecisionTreeClassifier(
        random_state=42
    ),
    'svm': CalibratedClassifierCV(SVC(random_state=42), ensemble=False),
}

print("\n Model Performance ")
results = {}
for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    results[name] = {
        'accuracy':  round(accuracy_score(y_test, y_pred), 4),
        'precision': round(precision_score(y_test, y_pred, zero_division=0), 4),
        'recall':    round(recall_score(y_test, y_pred, zero_division=0), 4),
        'f1':        round(f1_score(y_test, y_pred, zero_division=0), 4),
    }
    print(f"{name:20} | acc={results[name]['accuracy']} | "
          f"prec={results[name]['precision']} | "
          f"rec={results[name]['recall']} | "
          f"f1={results[name]['f1']}")

#  6. Save all models and scaler 
os.makedirs('ml_models', exist_ok=True)

for name, model in models.items():
    joblib.dump(model, f'ml_models/{name}_model.pkl')
    print(f"Saved: ml_models/{name}_model.pkl")

joblib.dump(scaler, 'ml_models/scaler.pkl')
print("Saved: ml_models/scaler.pkl")

print("\n All models trained and saved successfully")