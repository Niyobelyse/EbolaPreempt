"""Live regional-risk ingestion from WHO's public Ebola outbreak reports.

WHO publishes country/health-zone totals, not Rwanda district surveillance.
The reported DRC total is therefore allocated across Rwanda districts by their
static border-risk weights. These records are explicitly labelled as estimates.
"""

import re
from datetime import date, datetime

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.db import transaction

from .models import WeeklyDataRecord


class LiveIngestionError(RuntimeError):
    """Raised when the official source cannot be parsed safely."""


def _source_payload(url):
    response = requests.get(url, timeout=30, headers={'User-Agent': 'EbolaPreempt/1.0'})
    response.raise_for_status()
    text = BeautifulSoup(response.text, 'html.parser').get_text(' ', strip=True)

    # Prefer an explicitly reported cumulative DRC total.
    total_match = re.search(
        r'(?:cumulative\s+)?total\s+of\s+([\d,]+)\s+'
        r'(?:laboratory-)?confirmed\s+cases',
        text,
        flags=re.IGNORECASE,
    )
    if total_match:
        confirmed_cases = int(total_match.group(1).replace(',', ''))
    else:
        # WHO's rolling topic page can report an increment plus percentage
        # increase rather than the absolute total. Infer and round only then.
        increase_match = re.search(
            r'additional\s+([\d,]+)\s+confirmed\s+cases.*?increase(?:s)?\s+of\s+([\d.]+)%',
            text,
            flags=re.IGNORECASE,
        )
        if not increase_match:
            raise LiveIngestionError('Could not find a DRC confirmed-case total in the WHO report.')
        additional = int(increase_match.group(1).replace(',', ''))
        percentage = float(increase_match.group(2)) / 100
        confirmed_cases = round(additional * (1 + percentage) / percentage)

    date_match = re.search(r'Data\s+as\s+of\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})', text)
    if not date_match:
        raise LiveIngestionError('Could not find the WHO report date.')
    try:
        reported_date = datetime.strptime(date_match.group(1), '%d %B %Y').date()
    except ValueError as exc:
        raise LiveIngestionError('WHO report date has an unexpected format.') from exc

    return confirmed_cases, reported_date


def sync_who_ebola_data(source_url=None, force=False):
    """Create/update one estimated live-risk record per district for WHO's week."""
    source_url = source_url or settings.WHO_EBOLA_SOURCE_URL
    confirmed_cases, reported_date = _source_payload(source_url)
    iso_year, iso_week, _ = reported_date.isocalendar()
    week = f'{iso_year}-W{iso_week:02d}'
    week_start_date = date.fromisocalendar(iso_year, iso_week, 1)

    baselines = list(
        WeeklyDataRecord.objects.exclude(week='').order_by('district', '-week_start_date')
    )
    latest_by_district = {}
    for record in baselines:
        latest_by_district.setdefault(record.district, record)
    if not latest_by_district:
        raise LiveIngestionError('No district baselines found. Load the seeded dataset first.')

    records = list(latest_by_district.values())
    weights = [
        ((record.border_inflow_count or 0) + 1) / max(record.distance_to_outbreak_km or 1, 1)
        for record in records
    ]
    weight_total = sum(weights)
    if weight_total <= 0:
        raise LiveIngestionError('District baseline data does not contain usable border-risk weights.')

    created = 0
    with transaction.atomic():
        for baseline, weight in zip(records, weights):
            existing = WeeklyDataRecord.objects.filter(
                district=baseline.district, week_start_date=week_start_date
            ).first()
            if existing and existing.data_source != 'who_regional_estimate' and not force:
                raise LiveIngestionError(
                    f'{baseline.district} already has non-live data for {week}; use --force to replace it.'
                )

            defaults = {
                'week': week,
                'active_regional_cases': confirmed_cases * weight / weight_total,
                'distance_to_outbreak_km': baseline.distance_to_outbreak_km,
                'border_inflow_count': baseline.border_inflow_count,
                'transit_hub_count': baseline.transit_hub_count,
                'isolation_capacity_score': baseline.isolation_capacity_score,
                'data_source': 'who_regional_estimate',
                'source_url': source_url,
                'source_reported_date': reported_date,
            }
            _, was_created = WeeklyDataRecord.objects.update_or_create(
                district=baseline.district,
                week_start_date=week_start_date,
                defaults=defaults,
            )
            created += int(was_created)

    return {
        'week': week,
        'reported_date': reported_date.isoformat(),
        'confirmed_cases': confirmed_cases,
        'districts_updated': len(records),
        'districts_created': created,
        'source_url': source_url,
        'method': 'WHO regional total allocated by district border-risk weights',
    }
