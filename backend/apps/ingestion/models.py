from django.db import models

class WeeklyDataRecord(models.Model):
    district = models.CharField(max_length=100, default='Rubavu')
    week_start_date = models.DateField()
    fetched_at = models.DateTimeField(auto_now_add=True)

    # ISO week string (e.g. "2026-W20") matching data/raw/ml_features_dataset.csv,
    # used by the Isolation Forest risk model. Populated by load_risk_dataset.
    week = models.CharField(max_length=10, blank=True, default='')
    active_regional_cases = models.FloatField(null=True, blank=True)
    distance_to_outbreak_km = models.FloatField(null=True, blank=True)
    border_inflow_count = models.FloatField(null=True, blank=True)
    transit_hub_count = models.IntegerField(null=True, blank=True)
    isolation_capacity_score = models.IntegerField(null=True, blank=True)
    data_source = models.CharField(max_length=50, default='seeded_dataset')
    source_url = models.URLField(blank=True, default='')
    source_reported_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-week_start_date']

    def __str__(self):
        return f"{self.district} - {self.week_start_date}"