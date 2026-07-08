# EbolaPreempt

**ML-Powered Ebola Outbreak Prediction and Early Warning System for Rwanda**

## Demo & Deployment

| Resource | Link |
|---|---|
| **Live App** | https://ebolapreempt-1.onrender.com |
| **Backend API** | https://ebolapreempt.onrender.com/api |
| **Demo Video** | *(link to be added before submission)* |
| **GitHub Repository** | https://github.com/Niyobelyse/EbolaPreempt |

## Overview

EbolaPreempt is a machine learning early warning system built to help Rwanda detect potential Ebola cross-border risks before they become outbreaks. It pulls real epidemiological and mobility data from HDX/WHO, runs it through an Isolation Forest anomaly detection model, and surfaces risk scores and alerts on a live React dashboard.

One of the main challenges we faced early on was the lack of labelled data — there's no existing "this week was high risk / this week was safe" dataset for Rwanda. So instead of training a supervised model on fabricated labels, we chose Isolation Forest, which learns what a normal week looks like across all 30 districts and flags anything that statistically stands out. That decision shaped the whole project.

The full pipeline runs end-to-end:

```
HDX raw data → feature engineering → Isolation Forest inference
→ Prediction + Alert stored in PostgreSQL
→ React dashboard (Risk Score, Trend Chart, Alerts, History)
→ Automated daily re-prediction via GitHub Actions cron job
```

## System Architecture

```
data/raw/ml_features_dataset.csv         ← HDX + WHO data (30 districts × 7 weeks)
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
                    Inserts CSV rows into WeeklyDataRecord (PostgreSQL)
                            │
                            ▼
                POST /api/predictions/run/           ← manual (dashboard button)
                POST /api/predictions/run-all/       ← automated (GitHub Actions cron)
                    apps/prediction/services.py → run_prediction_for_district()
                    ml_models/predict.py → predict_risk()
                    Saves Prediction + Alert to DB
                            │
                            ▼
                React Dashboard   ← GET /api/predictions/latest-risk/
                React Predictions ← GET /api/predictions/
                React Alerts      ← GET /api/alerts/
                React History     ← GET /api/records/
```

## Project Structure

```
EbolaPreempt/
├── .github/workflows/
│   └── scheduled_predictions.yml   # GitHub Actions cron job (daily 20:00 CAT)
├── backend/
│   ├── apps/
│   │   ├── ingestion/
│   │   │   ├── models.py           
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── management/commands/load_risk_dataset.py
│   │   ├── prediction/
│   │   │   ├── models.py           # Prediction ORM model (FK → WeeklyDataRecord)
│   │   │   ├── services.py         # run_prediction_for_district() — shared logic
│   │   │   ├── views.py            # PredictionViewSet (run, run-all, latest-risk)
│   │   │   └── management/commands/run_scheduled_predictions.py
│   │   ├── alerts/
│   │   │   ├── models.py           # Alert ORM model (FK → Prediction)
│   │   │   └── views.py            # AlertViewSet (list, acknowledge)
│   │   └── users/                  # User management (Django auth)
│   ├── ml_models/
│   │   ├── predict.py              # predict_risk() inference wrapper
│   │   ├── test_predict.py         # 15 standalone ML unit tests
│   │   ├── isolation_forest_model.pkl
│   │   ├── scaler.pkl
│   │   ├── feature_cols.pkl
│   │   ├── model_feature_cols.pkl
│   │   └── score_bounds.pkl        # (min, max) for score normalisation
│   ├── ebolapreempt/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── Procfile                    # gunicorn --timeout 120 --workers 1
│   ├── build.sh                    # Render build script (migrate + load data + createsuperuser)
│   └── requirements.txt
├── data/
│   ├── raw/
│   │   ├── ml_features_dataset.csv # 210-row raw dataset (30 districts × 7 weeks)
│   │   └── pull_data.py            # HDX ingestion script
│   └── processed/
│       ├── model_ready_dataset.csv
│       └── isolation_forest_results.csv
├── frontend/ebopreempt/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx       # Risk score, trend chart, recent alerts
│   │   │   ├── Predictions.jsx     # Full prediction history table
│   │   │   ├── Alerts.jsx          # Alert management with acknowledge
│   │   │   └── History.jsx         # Raw weekly records + bar chart
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DistrictFilter.jsx  # Reusable per-page district selector
│   │   │   ├── RiskZoneMap.jsx     # SVG Rwanda choropleth map
│   │   │   ├── RiskBadge.jsx
│   │   │   ├── Card.jsx
│   │   │   └── StatCard.jsx
│   │   └── api/
│   │       ├── client.js           # Axios instance with JWT interceptors
│   │       ├── auth.js             # Login / token helpers
│   │       └── data.js             # getDistricts, getPredictions, runPrediction, …
│   └── package.json
├── notebooks/
│   ├── eda_data_preparation.ipynb
│   └── isolation_forest_model.ipynb
└── render.yaml
```

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Git

## Installation & Local Setup

### 1 — Clone the repository

```bash
git clone https://github.com/Niyobelyse/EbolaPreempt.git
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

# Create a superuser account (this is what you use to log in)
python manage.py createsuperuser

# Load the epidemiological dataset into the database
python manage.py load_risk_dataset

# Start the API server
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

`load_risk_dataset` reads `data/raw/ml_features_dataset.csv` and inserts one record per district-week pair. You can safely re-run it — it uses `update_or_create` so it won't create duplicates.

### 3 — Frontend

Open a new terminal:

```bash
cd frontend/ebopreempt
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 4 — Run your first prediction

1. Open `http://localhost:5173` and sign in with your superuser credentials.
2. Go to **Predictions** and pick a district from the filter (default is **Rubavu**).
3. Click **Run Prediction**. Behind the scenes the system:
   - Fetches all 210 weekly records from the database
   - Builds a full 30-district DataFrame so `National_Weekly_Cases` is calculated correctly
   - Runs `predict_risk()` through the trained Isolation Forest
   - Saves a `Prediction` row and auto-creates an `Alert`
4. Go to **Alerts** to see the generated warning and acknowledge it.
5. Go to **History** to browse the raw weekly epidemiological records.

### 5 — Run the cron job manually

```bash
# From backend/ with venv activated
python manage.py run_scheduled_predictions
```

This runs predictions for all 30 districts at once — the same command that GitHub Actions fires automatically every day at 20:00 CAT.

## ML Model

### Algorithm

We used **Isolation Forest** from scikit-learn with `n_estimators=200`, `contamination=0.1`, and `random_state=42`. It's an unsupervised anomaly detection algorithm that doesn't need any labelled risk data. It works by randomly partitioning the feature space and measuring how quickly a data point gets isolated — anomalous points (potential high-risk weeks) get isolated faster.

### Features

| Feature | Source | Type |
|---|---|---|
| Active Regional Cases | HDX/WHO | Raw |
| Distance to Outbreak (km) | DRC shapefile + district centroids | Raw |
| Border Inflow Count | HDX IOM mobility data | Raw |
| Transit Hub Count | District profile | Raw |
| Isolation Capacity Score | District health system data | Raw |
| Case_Trend | Weekly case delta per district | Engineered |
| National_Weekly_Cases | Sum of cases across all 30 districts that week | Engineered |
| Week_Number | ISO week integer extracted from the week string | Engineered |

All features are standardised with `StandardScaler` before being fed to the model.

### Training Dataset

210 rows covering 30 Rwandan districts across 7 weeks (2026-W20 through 2026-W26), sourced from HDX — WHO/OMS Ebola surveillance reports, DRC health zone shapefiles, and IOM mobility data.

### Results

| Metric | Value |
|---|---|
| District-weeks analysed | 210 |
| Flagged as HIGH RISK | 21 (10%) |
| Flagged as LOW RISK | 189 (90%) |
| Risk score range | 0.0 – 1.0 (normalised) |

Highest-risk districts for week 2026-W26:

| District | Risk Score | Alert |
|---|---|---|
| Musanze | 0.626 | HIGH |
| Kicukiro | 0.566 | HIGH |
| Nyagatare | 0.544 | HIGH |

### Inference Pipeline

```
WeeklyDataRecord rows (DB)
  → engineer_features()                  # adds Case_Trend, National_Weekly_Cases, Week_Number
  → StandardScaler.transform()           # scales all 8 features
  → IsolationForest.predict()            # +1 normal / -1 anomaly
  → IsolationForest.decision_function()  # continuous anomaly score
  → normalise to [0,1] using score_bounds.pkl
  → Prediction.objects.update_or_create()
  → Alert.objects.update_or_create()     # preserves acknowledged state on rerun
```

## API Reference

All endpoints except `/api/token/` require a JWT Bearer token in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/token/` | Get JWT access + refresh tokens |
| `POST` | `/api/token/refresh/` | Refresh an expired access token |
| `GET` | `/api/records/` | List all weekly data records |
| `GET` | `/api/records/districts/` | List districts that have data |
| `POST` | `/api/predictions/run/` | Run prediction for one district |
| `POST` | `/api/predictions/run-all/` | Run predictions for all districts (used by cron) |
| `GET` | `/api/predictions/` | List stored predictions (filter with `?district=`) |
| `GET` | `/api/predictions/latest-risk/` | Get the latest risk score for a district |
| `GET` | `/api/alerts/` | List all alerts |
| `PATCH` | `/api/alerts/{id}/acknowledge/` | Mark an alert as acknowledged |
| `GET` | `/` | Health check — returns `{"status": "running"}` |

## Testing

We used three testing strategies and ran them across different environments to make sure everything holds up beyond just a local SQLite setup.

### Testing strategies

| Strategy | Tool | What it covers |
|---|---|---|
| Model unit tests | Django `TestCase` | ORM field constraints, CRUD operations, ordering |
| API integration tests | DRF `APIClient` | HTTP status codes, JWT enforcement, response shape, district filtering |
| ML function unit tests | Python `unittest` | Feature engineering correctness, score bounds [0,1], edge cases |
| Edge case / boundary tests | Both suites | Empty DB, extreme inputs, duplicates, no-history inference |
| E2E browser test | Playwright (headless Chromium) | Full login → run prediction → alert → acknowledge flow |

### Django test suite — 27 tests

```bash
cd backend
source venv/bin/activate
python manage.py test apps.ingestion apps.alerts apps.prediction --verbosity=2
```

```
apps.ingestion  — 6 tests   WeeklyDataRecord CRUD, ordering, null fields, idempotent load
apps.alerts     — 8 tests   Alert model, serializer FK chain, API auth, acknowledge endpoint
apps.prediction — 13 tests  Prediction constraints, run endpoint, district filter, 404 on empty DB

Total: 27 tests in 5.46 s — OK (0 failures, 0 errors)
```

### ML unit test suite — 15 tests

```bash
cd backend
python ml_models/test_predict.py
```

```
TestEngineerFeatures — 6 tests   Column generation, Case_Trend delta, National_Weekly_Cases, history trim
TestPredictRisk      — 9 tests   Output shape, scores in [0,1], binary labels, extreme inputs, no history

Total: 15 tests in 0.36 s — OK (0 failures, 0 errors)

Combined: 42 tests, 0 failures, 0 errors
```

### Different inputs tested

| Input scenario | Test | Expected result | Result |
|---|---|---|---|
| Zero active cases | `test_zero_cases_scores_stay_bounded` | risk_score ≥ 0 | Passed |
| Extreme case count (99,999) | `test_extreme_case_count_scores_stay_bounded` | risk_score ≤ 1 | Passed |
| No historical weeks | `test_no_history_does_not_crash` | completes without exception | Passed |
| 6 weeks of history | `test_predict_risk_output_shape` | one result row per district | Passed |
| Empty database | `test_run_prediction_returns_404_when_no_data_loaded` | HTTP 404 | Passed |
| Unauthenticated request | `test_unauthenticated_run_rejected` | HTTP 401 | Passed |
| Duplicate dataset load | `test_update_or_create_idempotent` | 1 row, value updated | Passed |
| Rerun after acknowledging alert | `test_rerun_preserves_acknowledged_state` | `acknowledged` stays `True` | Passed |

### Environments tested

| Environment | OS | Python | Database | Outcome |
|---|---|---|---|---|
| Local development | Linux 5.15 (Ubuntu 22.04) | 3.11 | SQLite in-memory | 42/42 passed |
| Production | Render (Linux, containerised) | 3.11 | Neon PostgreSQL | Deployed and verified in browser |
| CI / cron | GitHub Actions ubuntu-latest | 3.11 | SQLite | Scheduled job running daily |

## Automated Predictions

Predictions run automatically every day at **20:00 CAT (18:00 UTC)** through a GitHub Actions workflow — no one needs to click anything.

The workflow (`.github/workflows/scheduled_predictions.yml`) does three things:
1. Sends a wake-up ping to the Render backend, which sleeps when idle on the free tier
2. Authenticates as admin to get a JWT token
3. Calls `POST /api/predictions/run-all/` and logs the results for all districts

You can also trigger it manually from the GitHub Actions tab anytime — useful for demos.

To set it up in your own fork, add one GitHub secret: go to **Settings → Secrets and variables → Actions → New repository secret**, name it `DJANGO_ADMIN_PASSWORD`, and paste your Django superuser password.

## Deployment

The entire stack runs on free infrastructure — no credit card required.

| Component | Service | Cost |
|---|---|---|
| Backend API | Render Web Service | Free |
| Database | Neon serverless PostgreSQL | Free (512 MB) |
| Frontend | Render Static Site | Free |
| Automated cron | GitHub Actions | Free |

### Step 1 — Get a Neon database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a project called `ebolapreempt`
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/ebolapreempt?sslmode=require
   ```

### Step 2 — Deploy the backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service** → connect your GitHub repo
2. Use these settings:

   | Setting | Value |
   |---|---|
   | Root Directory | `backend` |
   | Build Command | `chmod +x build.sh && ./build.sh` |
   | Start Command | `gunicorn ebolapreempt.wsgi:application --timeout 120 --workers 1` |
   | Instance Type | Free (Starter) |

3. Add these environment variables:

   | Key | Value |
   |---|---|
   | `SECRET_KEY` | click Generate |
   | `DEBUG` | `false` |
   | `DATABASE_URL` | Neon connection string |
   | `ALLOWED_HOSTS` | your Render URL (e.g. `ebolapreempt.onrender.com`) |
   | `CORS_ALLOWED_ORIGINS` | your frontend URL (fill in after Step 3) |
   | `DJANGO_SUPERUSER_USERNAME` | `admin` |
   | `DJANGO_SUPERUSER_EMAIL` | your email |
   | `DJANGO_SUPERUSER_PASSWORD` | a strong password — this is your login |

4. Click Deploy. The `build.sh` script handles migrations, loading the dataset, creating the superuser, and collecting static files automatically.

### Step 3 — Deploy the frontend on Render

1. **New → Static Site** → connect the same repo
2. Use these settings:

   | Setting | Value |
   |---|---|
   | Root Directory | `frontend/ebopreempt` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

3. Add a Redirect/Rewrite rule: `/* → /index.html` as a Rewrite (needed so direct URLs like `/predictions` don't return 404).
4. Copy your frontend URL and paste it into `CORS_ALLOWED_ORIGINS` in the backend service.

### Step 4 — Set up the cron job

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add a secret called `DJANGO_ADMIN_PASSWORD` with your superuser password
3. That's it — the workflow file is already in the repo and will start running at 20:00 CAT daily

### Deployment verification

| Check | Environment | Result |
|---|---|---|
| `GET /api/records/` returns 210 rows | Production | Verified |
| `POST /api/token/` returns JWT tokens | Production | Verified |
| Login works at the frontend URL | Production | Verified |
| Run Prediction generates a risk score | Production | Verified |
| Alert appears on the Alerts page | Production | Verified |
| Acknowledge button updates the status | Production | Verified |
| History page loads the records table | Production | Verified |
| GitHub Actions cron job fires daily | CI | Verified |
| Root URL returns `{"status": "running"}` | Production | Verified |

## Code Quality

One of our goals was to keep the codebase modular and avoid duplicating logic as the feature set grew.

**Shared service layer** — prediction logic lives in `apps/prediction/services.py` as a single `run_prediction_for_district()` function. Both the REST API view and the management command call it. When we added the cron job, we didn't have to copy any prediction code — we just called the same function from a new entry point.

**Reusable frontend components** — every repeated UI element (`DistrictFilter`, `RiskBadge`, `RiskZoneMap`, `StatCard`, `Card`) is its own component. Adding the Predictions page and History page was fast because we could drop in existing components without rewriting them.

**Centralised API layer** — the frontend never calls `axios` directly. All requests go through named functions in `src/api/data.js` (`getPredictions`, `runPrediction`, `acknowledgeAlert`, etc.). If the backend URL changes, we update one file.

**Upsert pattern** — `update_or_create` is used everywhere in the prediction and alert saving logic. Re-running a prediction for the same district and week updates the existing database row rather than adding a duplicate. The acknowledged state on alerts survives reruns.

**Environment-based configuration** — `settings.py` reads secrets from environment variables. The only file committed with a production value is `.env.production`, which only contains the public API URL.

Naming conventions: Django models use `PascalCase` (`WeeklyDataRecord`, `Prediction`, `Alert`), service and view functions use `snake_case`, React components use `PascalCase`, and state variables use `camelCase`. Styling is handled entirely with Tailwind utility classes — no separate CSS files.

## Analysis of Results

### What we set out to build

The approved proposal called for a system that ingests real epidemiological data for Rwanda's border districts, generates a weekly risk score per district, triggers automated alerts on elevated risk, and presents everything on a live dashboard accessible to public health analysts.

### What we actually delivered

| Goal | Status | Notes |
|---|---|---|
| Real data ingestion | Delivered | 210 rows from HDX/WHO — 30 districts × 7 weeks |
| Risk score per district/week | Delivered | Isolation Forest outputs a normalised [0,1] score |
| Automated alerts | Delivered | Alert created on every prediction run; reruns preserve acknowledged state |
| Live dashboard | Delivered | Dashboard, Predictions, Alerts, and History pages all working |
| Automated daily re-prediction | Delivered (extension) | GitHub Actions cron at 20:00 CAT — this went beyond the original scope |

### Why we switched from XGBoost to Isolation Forest

The original proposal listed XGBoost and Random Forest as candidate models. When we started collecting data we realised there's no labelled "high risk / low risk" history for Rwanda — every Ebola outbreak in the region has been in DRC, not Rwanda. Training a supervised model would have meant inventing labels, which would make the results meaningless.

Isolation Forest solved this cleanly. It doesn't need labels. It learns what a normal week looks like across all 30 districts and flags weeks that don't fit that pattern. We validated this approach with the supervisor before committing to it.

### Why feature engineering matters here

The raw HDX features (case counts, distances, inflow counts) don't tell the model anything about trends — a district with 50 cases this week looks the same whether it had 10 cases last week or 100. We added three engineered features to fix this:

- `Case_Trend` captures whether cases are rising or falling week-over-week in each district
- `National_Weekly_Cases` gives the model a country-wide epidemic signal for context
- `Week_Number` lets the model pick up on any seasonality in cross-border movement patterns

One tricky implementation detail: `National_Weekly_Cases` is the sum of cases across all 30 districts. If you compute it after filtering to a single district, you get that district's cases — which is just a duplicate of an existing feature. The fix was to always build the full 30-district DataFrame first, compute engineered features, then filter by district for the final output.

### Limitations we're honest about

| Limitation | Impact | What we'd do next |
|---|---|---|
| No labelled ground truth | Can't measure Precision, Recall, or Accuracy | Cross-validate against historical DRC outbreak timing once that data is available |
| `contamination=0.1` is hardcoded | The model always flags exactly 10% of weeks regardless of actual risk level | Replace with a data-driven threshold based on the score distribution |
| Distance is treated as linear | Rubavu (10 km from DRC) isn't consistently top-ranked | Add a `Proximity_Case_Risk = cases / (distance + 1)` interaction feature |
| Only 7 weeks of training data | Temporal patterns are weak with this little history | Retrain monthly as more HDX data becomes available; aim for 52+ weeks |
| Free-tier cold starts | Backend takes ~30 seconds to respond after sleeping | Add a keep-alive ping or move to a paid instance for production use |

### How this connects to the original problem

The system gives Rwanda's public health system an automated, data-driven signal for cross-border Ebola risk before cases show up at border screening stations. The prediction is based on the most recently available week of data — meaning there's a built-in 7–14 day early warning window. That's exactly what the proposal was trying to achieve.

## Discussion

### What each milestone contributed

Getting the data ingestion pipeline right first was essential. Without clean, consistently structured weekly records in the database, the ML model can't build a reliable normality baseline — garbage in, garbage out. The `load_risk_dataset` management command and the `WeeklyDataRecord` model were the foundation everything else was built on.

Training the model on all 30 districts simultaneously rather than district-by-district was a design decision that paid off. It means the model's definition of "normal" reflects Rwanda as a whole, not just one border district. Any district that deviates from the national pattern gets flagged — which is exactly the right framing for outbreak surveillance.

Extracting prediction logic into `services.py` was a small architectural decision that ended up saving a lot of work later. When we added the automated cron job, we didn't have to copy any prediction code — we just called `run_prediction_for_district()` from a new management command. That kind of reuse is only possible if the logic isn't buried inside a view function.

Deploying on free infrastructure was a deliberate choice. A system like this only has real-world value if it can run in resource-constrained environments — the kind of setup a public health agency in a low-income country might actually have access to. Render + Neon + GitHub Actions gets you a fully automated, production-grade pipeline at zero cost.

### Impact of what was built

The result is a system that a public health analyst can actually use. They log in, see the current risk score for their district, check if any alerts need acknowledging, and review historical trends — all without touching any code or running any scripts. The automated daily predictions mean the dashboard reflects the latest available data without anyone having to remember to trigger it. That kind of operational reliability is what separates a demo from a deployable tool.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, Vite, Recharts, Lucide Icons |
| Backend | Django 5.2, Django REST Framework 3.17, SimpleJWT |
| Database | SQLite (development) / PostgreSQL via Neon (production) |
| ML | scikit-learn 1.9 (IsolationForest, StandardScaler), pandas 3, NumPy, joblib |
| Data Sources | HDX — WHO/OMS Ebola surveillance, DRC health zone shapefiles, IOM mobility reports |
| Auth | JWT access + refresh tokens via djangorestframework-simplejwt |
| Testing | Django TestCase, DRF APIClient, Python unittest, Playwright |
| CI / Cron | GitHub Actions |
| Deployment | Render (web service + static site), Neon PostgreSQL |
