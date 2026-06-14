from rest_framework.routers import DefaultRouter
from .views import WeeklyDataRecordViewSet

router = DefaultRouter()
router.register(r'records', WeeklyDataRecordViewSet, basename='records')

urlpatterns = router.urls