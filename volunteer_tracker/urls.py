from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse
from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import os

from core.views import TeamMemberViewSet, AuthViewSet
from core.admin_views import AdminDashboardViewSet, SettingsView
from volunteers.views import VolunteerViewSet
from interactions.views import InteractionViewSet
from interactions.admin_views import InteractionAdminViewSet
from core.dashboard_views import (
    DashboardOverviewView, DashboardTrendsView, DashboardTeamActivityView,
    DashboardVolunteersNeedCheckinView, DashboardRecentInteractionsView,
    DashboardUpcomingFollowupsView, DashboardMyStatsView,
    DashboardEngagementMetricsView
)

# Create router and register viewsets
router = DefaultRouter()

# Regular endpoints (authenticated users)
router.register(r'team-members', TeamMemberViewSet, basename='team-member')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'volunteers', VolunteerViewSet, basename='volunteer')
router.register(r'interactions', InteractionViewSet, basename='interaction')

# Admin endpoints (admin users only)
router.register(r'admin/dashboard', AdminDashboardViewSet,
                basename='admin-dashboard')
router.register(r'admin/interactions', InteractionAdminViewSet,
                basename='admin-interaction')

# View to serve React app


def serve_react(request):
    try:
        index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
        with open(index_path) as f:
            return HttpResponse(f.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponse('Frontend build not found. Please run the build process.', status=404)


urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # JWT Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # API endpoints
    path('api/', include(router.urls)),

    # Admin Settings
    path('api/admin/settings/', SettingsView.as_view(), name='admin-settings'),

    # Dashboard endpoints
    path('api/dashboard/overview/', DashboardOverviewView.as_view(),
         name='dashboard-overview'),
    path('api/dashboard/trends/', DashboardTrendsView.as_view(),
         name='dashboard-trends'),
    path('api/dashboard/team-activity/',
         DashboardTeamActivityView.as_view(), name='dashboard-team-activity'),
    path('api/dashboard/volunteers-need-checkin/',
         DashboardVolunteersNeedCheckinView.as_view(), name='dashboard-volunteers-need-checkin'),
    path('api/dashboard/recent-interactions/',
         DashboardRecentInteractionsView.as_view(), name='dashboard-recent-interactions'),
    path('api/dashboard/upcoming-followups/',
         DashboardUpcomingFollowupsView.as_view(), name='dashboard-upcoming-followups'),
    path('api/dashboard/my-stats/', DashboardMyStatsView.as_view(),
         name='dashboard-my-stats'),
    path('api/dashboard/engagement-metrics/',
         DashboardEngagementMetricsView.as_view(), name='dashboard-engagement-metrics'),

    # Health check
    path('health/',
         lambda request: __import__('django.http').JsonResponse({'status': 'ok'})),

    # Serve React App - MUST be last to catch all remaining routes
    re_path(r'^.*$', serve_react, name='frontend'),
]
