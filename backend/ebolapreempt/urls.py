from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


def api_root(request):
    return JsonResponse({
        'service': 'EbolaPreempt API',
        'status': 'running',
        'docs': '/admin/',
        'api': '/api/',
    })


urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    # JWT auth
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # App URLs
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.ingestion.urls')),
    path('api/', include('apps.prediction.urls')),
    path('api/', include('apps.alerts.urls')),
]