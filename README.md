# EbolaPreempt

**ML-Powered Ebola Outbreak Prediction and Early Warning System for Rwanda**

---

## Description

EbolaPreempt is a full-stack web application that predicts cross-border Ebola risk
for Rwanda's Rubavu District (bordering DRC's North Kivu province) 7–14 days before
a symptomatic case reaches a border screening station.

The system automatically ingests live data from the Humanitarian Data Exchange (HDX)
and Open-Meteo APIs, engineers one-week historical lag features, and runs the data
through four benchmarked ML classifiers (XGBoost, Random Forest, Decision Tree, SVM)
to produce a binary early-warning alert displayed on a React dashboard.

**GitHub Repository:** https://github.com/belysetag/EbolaPreempt

---

## Project Structure

```
EbolaPreempt/
├── backend/                    # Django REST Framework API
│   ├── apps/
│   │   ├── ingestion/          # Data ingestion from HDX + Open-Meteo APIs
│   │   ├── prediction/         # ML model inference endpoints
│   │   ├── alerts/             # Alert logging and retrieval
│   │   └── users/              # User management (Django built-in auth)
│   ├── ml_models/              # Trained .pkl files + training script
│   │   ├── train_models.py
│   │   ├── xgboost_model.pkl
│   │   ├── random_forest_model.pkl
│   │   ├── decision_tree_model.pkl
│   │   ├── svm_model.pkl
│   │   └── scaler.pkl
│   ├── ebolapreempt/           # Django project settings + URLs
│   ├── manage.py
│   └── requirements.txt
├── frontend/ebopreempt/        # React + Tailwind CSS dashboard
│   ├── src/
│   │   ├── pages/              # Login, Dashboard
│   │   ├── components/         # Navbar, Sidebar, StatCard, RiskBadge, etc.
│   │   ├── api/                # Axios client, auth, data helpers
│   │   └── context/            # AuthContext (JWT state)
│   ├── package.json
│   └── vite.config.js
└── notebooks/
    └── EbolaPreempt_ML.ipynb   # Full ML development notebook
```

---

## Environment Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Git

### 1 — Clone the repository

```bash
git clone https://github.com/belysetag/EbolaPreempt.git
cd EbolaPreempt
```

### 2 — Backend setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create a superuser (for the login screen)
python manage.py createsuperuser

# Train and save all ML models
cd ml_models
python train_models.py
cd ..

# Ingest live weather + mobility data for all 30 Rwanda districts
python manage.py fetch_weekly_data

# Start the Django development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

### 3 — Frontend setup

Open a new terminal:

```bash
cd frontend/ebopreempt

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 4 — Running a prediction

1. Open `http://localhost:5173` and sign in with your superuser credentials.
2. Select a district from the sidebar (default: **Rubavu**).
3. Click **Run Prediction** — the system fetches the latest weekly record,
   runs it through XGBoost, and displays the risk score and alert status.

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Obtain JWT access + refresh tokens |
| POST | `/api/token/refresh/` | Refresh access token |
| GET | `/api/records/` | List all weekly data records |
| GET | `/api/records/districts/` | List districts that have data |
| POST | `/api/predictions/run/` | Run ML prediction for a district |
| GET | `/api/predictions/latest-risk/` | Get latest risk score |
| GET | `/api/alerts/` | List all logged alerts |

All endpoints except `/api/token/` require a JWT Bearer token.

---

## ML Models

Four classifiers are benchmarked (see `notebooks/EbolaPreempt_ML.ipynb`):

| Model | CV F1 (5-fold) | Test Accuracy | Test Precision |
|---|---|---|---|
| **XGBoost** ✅ | **0.8533** | 0.8333 | 1.0000 |
| Random Forest | 0.8133 | 0.7500 | 1.0000 |
| Decision Tree | 0.8114 | 0.8333 | 1.0000 |
| SVM | 0.7514 | 0.6667 | 0.0000 |

XGBoost is selected as the production model based on highest 5-fold CV F1-score.
Models are serialised as `.pkl` files and loaded at Django startup.

**Features used:** `ebola_cases`, `cases_lag_1wk`, `temperature`, `rainfall`,
`ndvi_value`, `transit_volume`, `transit_lag_1wk`

**Target:** `early_warning_alert` (binary — 0 = Low Risk, 1 = High Risk)

---

## Deployment Plan

### Current (Development)
- Backend: Django dev server (`manage.py runserver`) on `localhost:8000`
- Frontend: Vite dev server (`npm run dev`) on `localhost:5173`
- Database: SQLite (local file `db.sqlite3`)

### Production Target (July 2026)
- **Backend:** AWS EC2 (t3.micro) running Django via Gunicorn + Nginx
- **Database:** AWS RDS PostgreSQL 17 (swap `settings.py` ENGINE to `django.db.backends.postgresql`)
- **Static files:** AWS S3 bucket
- **Frontend:** Built with `npm run build` and served from S3 or Netlify
- **Environment variables:** `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS` loaded from `.env`

---

## Screenshots

See `/designs/` folder for Figma wireframes and app screenshots.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, Vite, Recharts |
| Backend | Django 5.2, Django REST Framework 3.17, SimpleJWT |
| Database | SQLite |
| ML | scikit-learn 1.9, XGBoost 3.x, pandas, NumPy |
| Data Sources | HDX API (Ebola cases), Open-Meteo API (weather), IOM reports (mobility) |
| Auth | JWT (access + refresh tokens) |

