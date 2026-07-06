from rest_framework import serializers
from .models import Alert

class AlertSerializer(serializers.ModelSerializer):
    district = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = '__all__'

    def get_district(self, obj):
        try:
            return obj.prediction.record.district
        except Exception:
            return 'Unknown'