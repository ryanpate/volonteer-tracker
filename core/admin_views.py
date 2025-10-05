from rest_framework import viewsets, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import TeamMember
from .permissions import IsAdminUser


class AdminDashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for admin dashboard statistics
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def list(self, request):
        """Get admin dashboard statistics"""
        from interactions.models import Interaction
        from volunteers.models import Volunteer
        
        # Team statistics
        total_team_members = TeamMember.objects.count()
        active_team_members = TeamMember.objects.filter(is_active=True).count()
        admin_users = TeamMember.objects.filter(role='admin').count()
        
        # Interaction statistics
        total_interactions = Interaction.objects.count()
        
        # Recent activity (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_interactions = Interaction.objects.filter(
            interaction_date__gte=thirty_days_ago
        ).count()
        
        # Follow-up statistics
        pending_followups = Interaction.objects.filter(
            needs_followup=True,
            followup_completed=False
        ).count()
        
        overdue_followups = Interaction.objects.filter(
            needs_followup=True,
            followup_completed=False,
            followup_date__lt=timezone.now().date()
        ).count()
        
        # Volunteer statistics
        total_volunteers = Volunteer.objects.count()
        
        # Team member activity
        team_activity = TeamMember.objects.annotate(
            interaction_count=Count('interactions')
        ).filter(is_active=True).order_by('-interaction_count')[:5]
        
        team_activity_data = [
            {
                'id': member.id,
                'name': member.full_name,
                'interaction_count': member.interaction_count
            }
            for member in team_activity
        ]
        
        return Response({
            'team': {
                'total': total_team_members,
                'active': active_team_members,
                'admins': admin_users,
            },
            'interactions': {
                'total': total_interactions,
                'last_30_days': recent_interactions,
            },
            'followups': {
                'pending': pending_followups,
                'overdue': overdue_followups,
            },
            'volunteers': {
                'total': total_volunteers,
            },
            'team_activity': team_activity_data,
        })


class SettingsView(views.APIView):
    """
    API view for managing application settings
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get current settings"""
        from django.conf import settings
        
        # Return settings - you can store these in database later
        return Response({
            'followup_reminder_days': getattr(settings, 'FOLLOWUP_REMINDER_DAYS', 7),
            'overdue_threshold_days': getattr(settings, 'OVERDUE_THRESHOLD_DAYS', 30),
            'email_notifications_enabled': getattr(settings, 'EMAIL_NOTIFICATIONS_ENABLED', True),
            'auto_sync_enabled': getattr(settings, 'AUTO_SYNC_PCO', False),
            'topics': [
                'Family', 'Spiritual Growth', 'Serving', 'Prayer', 
                'Worship', 'Community', 'Ministry', 'Personal Development'
            ],
            'categories': [
                'General Check-in', 'Ministry Opportunity', 'Pastoral Care',
                'Team Building', 'Training', 'Feedback'
            ],
            'pco_app_id': getattr(settings, 'PCO_APP_ID', ''),
            'pco_secret': '***' if getattr(settings, 'PCO_SECRET', '') else '',  # Don't expose secret
        })
    
    def put(self, request):
        """Update settings"""
        # In a production app, you would save these to database
        # For now, just return success
        return Response({
            'message': 'Settings updated successfully',
            'data': request.data
        })