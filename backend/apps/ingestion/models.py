from django.db import models

class WeeklyDataRecord(models.Model):
    district = models.CharField(max_length=100, default='Rubavu')
    week_start_date = models.DateField()
    ebola_cases = models.IntegerField(default=0)
    cases_lag_1wk = models.IntegerField(default=0)
    temperature = models.FloatField(default=0.0)
    rainfall = models.FloatField(default=0.0)
    ndvi_value = models.FloatField(default=0.0)
    transit_volume = models.IntegerField(default=0)
    transit_lag_1wk = models.IntegerField(default=0)
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-week_start_date']

    def __str__(self):
        return f"{self.district} - {self.week_start_date}"