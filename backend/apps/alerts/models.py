from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from apps.prediction.models import Prediction

class Alert(models.Model):
    ALERT_LEVELS = [
        ('LOW', 'Low Risk'),
        ('HIGH', 'High Risk'),
    ]
    prediction = models.OneToOneField(
        Prediction,
        on_delete=models.CASCADE,
        related_name='alerts'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='alerts'
    )
    alert_level = models.CharField(max_length=10, choices=ALERT_LEVELS)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert {self.id} - {self.alert_level}"
