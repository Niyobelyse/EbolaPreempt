from rest_framework import serializers
from .models import WeeklyDataRecord

class WeeklyDataRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyDataRecord
        fields = '__all__'