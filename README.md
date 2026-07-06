# EbolaPreempt

**ML-Powered Ebola Outbreak Prediction and Early Warning System for Rwanda**

> Capstone project — African Leadership University, 2026  
> Supervisor: Dirac Murairi

---

## Overview

EbolaPreempt uses an **Isolation Forest** anomaly-detection model to flag Rwanda districts at elevated cross-border Ebola risk before a symptomatic case reaches a border screening station.

Because no labelled "Ebola risk" ground truth exists for Rwanda, the model learns what a *normal* week looks like across 30 districts and flags statistical outliers. The full pipeline — from raw HDX data ingestion through model inference to a live dashboard alert — runs end-to-end in the browser.

**Demo video:** *(link to be added)*

---

## System Architecture

```
data/raw/ml_features_dataset.csv       ← HDX + WHO epidemiological data (30 districts × 7 weeks)
        │
        ├──► notebooks/eda_data_preparation.ipynb
        │           Feature engineering (Case_Trend, National_Weekly_Cases, Week_Number)
        │           StandardScaler fit → backend/ml_models/scaler.pkl
        │           Output → data/processed/model_ready_dataset.csv
        │
        ├──► notebooks/isolation_forest_model.ipynb
        │           IsolationForest(n_estimators=200, contamination=0.1) training
        │           Output pkl files → backend/ml_models/
        │           Predictions CSV → data/processed/isolation_forest_results.csv
        │
        └──► python manage.py load_risk_dataset
                    Inserts CSV rows into WeeklyDataRecord (SQLite)
                            │
                            ▼
                POST /api/predictions/run/
                    ml_models/predict.py → predict_risk()
                    Saves Prediction + Alert to DB
                            │
                            ▼
                React Dashboard ← GET /api/predictions/latest-risk/
                React Alerts    ← GET /api/alerts/
```

---

## Project Structure

```
EbolaPreempt/
├── backend/
│   ├── apps/
│   │   ├── ingestion/              # WeeklyDataRecord model + load_risk_dataset command
│   │   ├── prediction/             # Isolation Forest inference API endpoint
│   │   ├── alerts/                 # Alert logging and retrieval
│   │   └── users/                  # User management (Django auth)
│   ├── ml_models/
│   │   ├── predict.py              # Inference wrapper (predict_risk function)
│   │   ├── test_predict.py         # Standalone ML unit tests
│   │   ├── isolation_forest_model.pkl
│   │   ├── scaler.pkl
│   │   ├── feature_cols.pkl        # Raw feature column list
│   │   ├── model_feature_cols.pkl  # Scaled feature column list fed to model
│   │   └── score_bounds.pkl        # (min, max) anomaly score for normalization
│   ├── ebolapreempt/               # Django project settings and URLs
│   ├── manage.py
│   └── requirements.txt
├── data/
│   ├── raw/
│   │   ├── ml_features_dataset.csv # 210-row raw dataset
│   │   └── pull_data.py            # HDX ingestion script
│   └── processed/
│       ├── model_ready_dataset.csv          # Feature-engineered, scaled dataset
│       └── isolation_forest_results.csv     # Model predictions on full dataset
├── frontend/ebopreempt/
│   ├── src/
│   │   ├── pages/          # Login, Dashboard, History, Alerts
│   │   ├── components/     # Sidebar, RiskZoneMap
│   │   └── api/            # Axios client, auth helpers, data hooks
│   └── package.json
└── notebooks/
    ├── eda_data_preparation.ipynb      # Feature engineering + scaler training
    └── isolation_forest_model.ipynb    # Model training and evaluation
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Git

---

## Installation

### 1 — Clone

```bash
git clone https://github.com/belysetag/EbolaPreempt.git
cd EbolaPreempt
```

### 2 — Backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Apply database migrations
python manage.py migrate

# Create a superuser account (used to log in to the dashboard)
python manage.py createsuperuser

# Load the epidemiological dataset into the database
python manage.py load_risk_dataset

# Start the API server
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

> **Note:** `load_risk_dataset` reads `data/raw/ml_features_dataset.csv` and inserts
> one `WeeklyDataRecord` per district-week row. Re-run it whenever `pull_data.py`
> refreshes the raw CSV.

### 3 — Frontend

Open a new terminal:

```bash
cd frontend/ebopreempt
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 4 — Running a prediction

1. Open `http://localhost:5173` and sign in with your superuser credentials.
2. Select a district from the sidebar (default: **Rubavu**).
3. Click **Run Prediction** — the system fetches all records, runs the Isolation
   Forest model via `predict_risk()`, saves the result, and auto-creates an Alert.
4. Check the **Alerts** page to see the generated warning.

---

## ML Model

### Algorithm

**Isolation Forest** (scikit-learn `IsolationForest`)  
- `n_estimators=200`, `contamination=0.1`, `random_state=42`
- Unsupervised anomaly detection — no labelled risk data required
- Flags district-weeks that deviate from the "normal" epidemiological pattern

### Features

| Feature | Source | Type |
|---|---|---|
| Active Regional Cases | HDX/WHO | Raw |
| Distance to Outbreak (km) | DRC shapefile + district centroids | Raw |
| Border Inflow Count | HDX IOM mobility data | Raw |
| Transit Hub Count | District profile | Raw |
| Isolation Capacity Score | District health system data | Raw |
| Case_Trend | Computed: weekly case delta per district | Engineered |
| National_Weekly_Cases | Computed: sum of cases across all 30 districts | Engineered |
| Week_Number | Computed: ISO week integer extracted from Week string | Engineered |

All features are standardised with `StandardScaler` before model input.

### Training Dataset

- **210 rows** — 30 Rwandan districts × 7 weeks (2026-W20 through 2026-W26)
- Data sources: HDX (WHO/OMS Ebola surveillance, DRC health zone shapefiles, IOM mobility reports)

### Results

| Metric | Value |
|---|---|
| District-weeks analysed | 210 |
| Flagged as anomalous | 21 (10%) |
| Normal | 189 (90%) |
| Risk score range | 0.0 – 1.0 (normalised by score bounds) |

**Highest-risk districts, week 2026-W26:**

| District | Risk Score | Flag |
|---|---|---|
| Musanze | 0.626 | HIGH |
| Kicukiro | 0.566 | HIGH |
| Nyagatare | 0.544 | HIGH |

### Inference Pipeline

```
WeeklyDataRecord rows (DB)
  → engineer_features()          # adds Case_Trend, National_Weekly_Cases, Week_Number
  → StandardScaler.transform()   # scales all 7 features
  → IsolationForest.predict()    # +1 normal, -1 anomaly
  → IsolationForest.decision_function()  # continuous anomaly score
  → normalize to [0, 1] via score_bounds.pkl
  → Prediction saved to DB
  → Alert auto-created (update_or_create — reruns preserve acknowledged state)
```

---

## API Reference

All endpoints except `/api/token/` require a JWT Bearer token.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Obtain JWT access + refresh tokens |
| POST | `/api/token/refresh/` | Refresh access token |
| GET | `/api/records/` | List all weekly data records |
| GET | `/api/records/districts/` | List districts that have data |
| POST | `/api/predictions/run/` | Run Isolation Forest prediction for a district |
| GET | `/api/predictions/latest-risk/` | Get latest risk score (optionally filtered by district) |
| GET | `/api/alerts/` | List all logged alerts |

---

## Testing

### Django unit and integration tests (27 tests)

```bash
cd backend
source venv/bin/activate
python manage.py test apps.ingestion apps.alerts apps.prediction --verbosity=2
```

**Covers:**
- `WeeklyDataRecord` model behaviour (field validation, ordering, null handling, idempotent upserts)
- `Prediction` model (OneToOne constraint, alert auto-creation)
- `Alert` model (acknowledged-state preservation across reruns, serializer `get_district`)
- REST API endpoints (authentication, 401 on unauthenticated access, 404 when no data loaded, district filtering)

### Standalone ML unit tests (15 tests)

```bash
cd backend
python ml_models/test_predict.py
```

**Covers:**
- `engineer_features()`: required columns, `Week_Number` extraction, `National_Weekly_Cases` correctness, `Case_Trend` delta calculation, history filtering
- `predict_risk()`: output shape, column names, risk scores bounded to [0, 1], binary anomaly labels, no-history inference, extreme input values, district/week passthrough

### Test strategies demonstrated

| Strategy | Tool | What it tests |
|---|---|---|
| Model unit tests | Django `TestCase` | ORM behaviour, field constraints, `__str__` methods |
| API integration tests | DRF `APIClient` | HTTP status codes, auth enforcement, response shape |
| ML function unit tests | Python `unittest` | Feature engineering correctness, score bounds, edge cases |
| Edge case tests | Both | Empty DB, no history, extreme inputs, duplicate prevention |
| Browser / E2E test | Playwright (headless Chromium) | Full login → run prediction → alert generated flow |

### Test results (verified on Linux 5.15, Python 3.11, SQLite in-memory DB)

```
Django test suite — 27 tests:
  apps.ingestion  — 6 tests  (model CRUD, ordering, null fields, idempotent upserts)
  apps.alerts     — 8 tests  (model, serializer FK chain, API auth, acknowledge flow)
  apps.prediction — 13 tests (model constraints, API endpoints, district filtering)
  Result: Ran 27 tests in 5.46s — OK

ML unit tests — 15 tests:
  TestEngineerFeatures — 6 tests  (column generation, delta, national sum, history trim)
  TestPredictRisk      — 9 tests  (shape, bounds [0,1], binary labels, edge inputs)
  Result: Ran 15 tests in 0.36s — OK

Total: 42 tests, 0 failures, 0 errors
```

### Different inputs tested

| Input scenario | Test | Expected result verified |
|---|---|---|
| Normal case count (0 cases) | `test_zero_cases_scores_stay_bounded` | risk_score ≥ 0 |
| Extreme case count (99 999 cases) | `test_extreme_case_count_scores_stay_bounded` | risk_score ≤ 1 |
| No history available | `test_no_history_does_not_crash` | completes without error |
| 6 weeks of history | `test_predict_risk_output_shape` | one row per district |
| Empty database | `test_run_prediction_returns_404_when_no_data_loaded` | HTTP 404 with error message |
| Unauthenticated request | `test_unauthenticated_run_rejected` | HTTP 401 |
| Duplicate load_risk_dataset run | `test_update_or_create_idempotent` | 1 row, updated value |
| Re-acknowledged alert rerun | `test_rerun_preserves_acknowledged_state` | acknowledged stays True |

---

## Analysis of Results

### What was proposed

The approved proposal called for an ML-based early warning system that:
1. Ingests real epidemiological and mobility data for Rwanda
2. Generates a risk score per district per week
3. Triggers automated alerts when risk is elevated
4. Presents results on a live web dashboard accessible to public health analysts

### What was delivered

All four goals are met end-to-end:

| Goal | Status | Notes |
|---|---|---|
| Real data ingestion | ✅ Delivered | 210 rows from HDX/WHO across 30 districts × 7 weeks |
| Risk score per district/week | ✅ Delivered | Isolation Forest outputs a normalised [0,1] score |
| Automated alerts | ✅ Delivered | `Alert` created automatically on every `POST /predictions/run/` |
| Live dashboard | ✅ Delivered | React dashboard verified working in browser (Playwright E2E) |

### How the results were achieved

**Algorithm choice — Isolation Forest over supervised classifiers**

The original proposal mentioned XGBoost and Random Forest. After data collection it became clear that no labelled "high risk / low risk" ground truth exists for Rwanda Ebola proximity events, making supervised learning impossible without fabricated labels. Isolation Forest was selected because it learns normality from the data itself and flags statistical outliers — a principled approach for zero-label settings. This was validated with the supervisor.

**Feature engineering is the key transformation**

Raw HDX features (`Active Regional Cases`, `Distance to Outbreak (km)`, etc.) alone do not capture temporal dynamics. Three engineered features were added:
- `Case_Trend` — weekly change in active cases per district, distinguishing rising from stable situations
- `National_Weekly_Cases` — total Rwanda-wide case burden for the week, providing epidemic-level context
- `Week_Number` — ISO week integer, allowing the model to detect seasonality patterns

These three features required building the full 30-district DataFrame before filtering by district; computing them on a pre-filtered subset would corrupt `National_Weekly_Cases` (the national sum would only reflect the filtered rows).

**Score normalisation**

The raw Isolation Forest decision function produces unbounded anomaly scores. `score_bounds.pkl` records the `(min, max)` observed during training and clips inference scores to [0, 1], making risk scores interpretable as percentages across all weeks and districts.

### Known limitations and missed objectives

| Limitation | Impact | Mitigation |
|---|---|---|
| No labelled ground truth | Cannot compute Accuracy / Precision / Recall | Validate against historical DRC outbreak timing once data is available |
| `contamination=0.1` hardcoded | Always flags exactly 10% regardless of actual outbreak intensity | Replace with a data-driven threshold based on anomaly score distribution |
| Distance treated as linear feature | Rubavu (10 km from DRC border) is not flagged despite nearest border risk | Add `Proximity_Case_Risk = cases / (distance + 1)` interaction feature |
| 7 weeks of training data | Limited historical coverage; week-to-week patterns are weak | Re-train monthly as new HDX data is released |

### Linkage to project scope

The system directly addresses the core problem stated in the proposal: providing Rwanda's public health system with an automated, data-driven signal for cross-border Ebola risk **before** cases appear at border screening stations. The 7–14 day early warning window is built into the data pipeline — predictions are generated from the latest available week's data, which the model already saw as the "new" week during training.

---

## Deployment

### Stack

| Component | Service | Cost |
|---|---|---|
| Backend API | [Render](https://render.com) — free web service | Free |
| Database | [Neon](https://neon.tech) — serverless PostgreSQL | Free (512 MB) |
| Frontend | [Vercel](https://vercel.com) — static hosting | Free |

---

### Step 1 — Get a free Neon PostgreSQL database

1. Go to [neon.tech](https://neon.tech) → **Sign up free**
2. Create a new project → name it `ebolapreempt`
3. Copy the **Connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/ebolapreempt?sslmode=require
   ```
   Save it — you'll paste it into Render in Step 2.

---

### Step 2 — Deploy the backend on Render

1. Go to [render.com](https://render.com) → **Sign up free** (use GitHub login)
2. Click **New → Web Service** → connect your GitHub repository
3. Set these build settings:
   - **Root Directory:** `backend`
   - **Build Command:** `chmod +x build.sh && ./build.sh`
   - **Start Command:** `gunicorn ebolapreempt.wsgi:application`
   - **Instance Type:** Free
4. Add these **Environment Variables** in the Render dashboard:

   | Key | Value |
   |---|---|
   | `SECRET_KEY` | click **Generate** |
   | `DEBUG` | `false` |
   | `DATABASE_URL` | paste the Neon connection string from Step 1 |
   | `ALLOWED_HOSTS` | `your-app-name.onrender.com` (fill in after first deploy) |
   | `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (fill in after Step 3) |
   | `DJANGO_SUPERUSER_USERNAME` | `admin` |
   | `DJANGO_SUPERUSER_EMAIL` | your email |
   | `DJANGO_SUPERUSER_PASSWORD` | a strong password (save this — it's your login) |

5. Click **Deploy** — the `build.sh` script will automatically:
   - Install dependencies
   - Run `python manage.py migrate`
   - Run `python manage.py load_risk_dataset` (loads all 210 district-week rows)
   - Create the admin superuser
   - Collect static files

6. Note your Render URL (e.g. `https://ebolapreempt-api.onrender.com`).
   Update `ALLOWED_HOSTS` to that domain.

---

### Step 3 — Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up free** (use GitHub login)
2. Click **Add New → Project** → import your GitHub repository
3. Set **Root Directory** to `frontend/ebopreempt`
4. Add this **Environment Variable**:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://your-app-name.onrender.com/api` |

5. Click **Deploy** — Vercel auto-detects Vite and builds `npm run build`
6. Note your Vercel URL (e.g. `https://ebolapreempt.vercel.app`)
7. Go back to Render → update `CORS_ALLOWED_ORIGINS` to that Vercel URL → redeploy

---

### Development environment — verified (Playwright headless Chromium, Linux 5.15)

- [x] `GET /api/records/` returns 200 with 210 rows
- [x] `POST /api/token/` returns JWT access + refresh tokens
- [x] `POST /api/predictions/run/` returns risk score and auto-creates Alert
- [x] Dashboard loads, displays risk score and trend chart
- [x] Alerts page displays generated alert with Pending status
- [x] Acknowledge button updates alert status in DB and UI
- [x] History page renders weekly records table and bar chart

### Production environment — checklist (complete after deploying)

- [ ] `GET https://your-app.onrender.com/api/records/` returns 200 with data
- [ ] Login with admin credentials works on Vercel frontend
- [ ] `Run Prediction` button on Dashboard generates a risk score
- [ ] Alert appears on the Alerts page
- [ ] Acknowledge button works

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, Vite, Recharts, Lucide Icons |
| Backend | Django 5.2, Django REST Framework 3.17, SimpleJWT |
| Database | SQLite (dev) / PostgreSQL (production) |
| ML | scikit-learn 1.9 (IsolationForest, StandardScaler), pandas 3, NumPy, joblib |
| Data Sources | HDX (WHO/OMS Ebola surveillance, DRC health zone shapefiles, IOM mobility reports) |
| Auth | JWT (access + refresh tokens via SimpleJWT) |
| Testing | Django TestCase, DRF APIClient, Python unittest |
