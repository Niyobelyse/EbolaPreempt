#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py migrate

# Load the epidemiological dataset into the database
python manage.py load_risk_dataset

# Create the admin superuser if it doesn't exist yet (safe to re-run)
python manage.py createsuperuser --noinput 2>/dev/null || true

python manage.py collectstatic --noinput
