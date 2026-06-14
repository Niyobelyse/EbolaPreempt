from django.db import models

# Create your models here.
from django.db import models
from apps.ingestion.models import WeeklyDataRecord

class Prediction(models.Model):
    record = models.OneToOneField(
        WeeklyDataRecord,
        on_delete=models.CASCADE,
        related_name='prediction'
    )
    model_used = models.CharField(max_length=50)
    risk_score = models.FloatField()
    early_warning_alert = models.IntegerField(default=0)
    accuracy = models.FloatField(null=True, blank=True)
    predicted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prediction {self.id} - Alert: {self.early_warning_alert}"