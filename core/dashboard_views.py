from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Max, Q
from django.utils import timezone
from datetime import timedelta
from volunteers.models import Volunteer
from interactions.models import Interaction
from core.models import TeamMember

class DashboardOverviewView(APIView):
    """Dashboard overview statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        
        overview = {
            'total_volunteers': Volunteer.objects.count(),
            'total_interactions': Interaction.objects.count(),
            'interactions_this_month': Interaction.objects.filter(
                interaction_date__gte=thirty_days_ago
            ).count(),
            'pending_followups': Interaction.objects.filter(
                needs_followup=True,
                followup_completed=False
            ).count(),
            'overdue_followups': Interaction.objects.filter(
                needs_followup=True,
                followup_completed=False,
                followup_date__lt=today
            ).count(),
            'active_team_members': TeamMember.objects.filter(is_active=True).count(),
        }
        
        return Response({'overview': overview})

class DashboardTrendsView(APIView):
    """Interaction trends over last 6 months"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.db.models.functions import TruncMonth
        
        six_months_ago = timezone.now().date() - timedelta(days=180)
        
        trends = Interaction.objects.filter(
            interaction_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('interaction_date')
        ).values('month').annotate(
            interaction_count=Count('id')
        ).order_by('month')
        
        return Response({'trends': list(trends)})

class DashboardTeamActivityView(APIView):
    """Team member activity statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        team_activity = TeamMember.objects.filter(
            is_active=True
        ).annotate(
            total_interactions=Count('interactions'),
            interactions_this_month=Count(
                'interactions',
                filter=Q(interactions__interaction_date__gte=thirty_days_ago)
            ),
            last_interaction_date=Max('interactions__interaction_date')
        ).values(
            'id', 'first_name', 'last_name',
            'total_interactions', 'interactions_this_month', 'last_interaction_date'
        ).order_by('-total_interactions')
        
        return Response({'team_activity': list(team_activity)})

class DashboardVolunteersNeedCheckinView(APIView):
    """Volunteers who need check-in (30+ days since last contact)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        # Volunteers with no recent interactions
        volunteers = Volunteer.objects.annotate(
            last_interaction_date=Max('interactions__interaction_date'),
            total_interactions=Count('interactions')
        ).filter(
            Q(last_interaction_date__lt=thirty_days_ago) | Q(last_interaction_date__isnull=True)
        ).values(
            'id', 'first_name', 'last_name', 'email', 'phone',
            'last_interaction_date', 'total_interactions'
        ).order_by('last_interaction_date')[:20]
        
        return Response({'volunteers': list(volunteers)})

class DashboardRecentInteractionsView(APIView):
    """Recent interactions"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        
        from interactions.serializers import InteractionSerializer
        
        recent = Interaction.objects.select_related(
            'volunteer', 'team_member'
        ).order_by('-created_at')[:limit]
        
        serializer = InteractionSerializer(recent, many=True)
        return Response({'recent_interactions': serializer.data})

class DashboardUpcomingFollowupsView(APIView):
    """Upcoming follow-ups"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 7))
        today = timezone.now().date()
        end_date = today + timedelta(days=days)
        
        from interactions.serializers import InteractionSerializer
        
        upcoming = Interaction.objects.filter(
            needs_followup=True,
            followup_completed=False,
            followup_date__lte=end_date,
            followup_date__gte=today
        ).select_related('volunteer', 'team_member').order_by('followup_date')
        
        serializer = InteractionSerializer(upcoming, many=True)
        return Response({'upcoming_followups': serializer.data})

class DashboardMyStatsView(APIView):
    """Current user's statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        seven_days_ago = today - timedelta(days=7)
        
        stats = {
            'total_interactions': user.interactions.count(),
            'interactions_this_month': user.interactions.filter(
                interaction_date__gte=thirty_days_ago
            ).count(),
            'interactions_this_week': user.interactions.filter(
                interaction_date__gte=seven_days_ago
            ).count(),
            'my_pending_followups': user.interactions.filter(
                needs_followup=True,
                followup_completed=False
            ).count(),
            'volunteers_contacted': user.interactions.values('volunteer').distinct().count(),
            'last_interaction_date': user.interactions.aggregate(
                Max('interaction_date')
            )['interaction_date__max'],
        }
        
        return Response({'my_stats': stats})

class DashboardEngagementMetricsView(APIView):
    """Volunteer engagement metrics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        sixty_days_ago = today - timedelta(days=60)
        thirty_days_ago = today - timedelta(days=30)
        
        # Categorize volunteers by engagement
        volunteers = Volunteer.objects.annotate(
            interaction_count=Count('interactions'),
            last_interaction_date=Max('interactions__interaction_date')
        )
        
        metrics = {
            'never_contacted': volunteers.filter(interaction_count=0).count(),
            'at_risk': volunteers.filter(
                interaction_count__gt=0,
                last_interaction_date__lt=sixty_days_ago
            ).count(),
            'moderately_engaged': volunteers.filter(
                last_interaction_date__gte=sixty_days_ago,
                last_interaction_date__lt=thirty_days_ago
            ).count(),
            'highly_engaged': volunteers.filter(
                last_interaction_date__gte=thirty_days_ago
            ).count(),
        }
        
        # Calculate average
        total_volunteers = volunteers.count()
        total_interactions = Interaction.objects.count()
        metrics['avg_interactions_per_volunteer'] = round(
            total_interactions / total_volunteers if total_volunteers > 0 else 0,
            2
        )
        
        return Response({'engagement_metrics': metrics})