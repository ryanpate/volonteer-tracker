from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Interaction
from .serializers import InteractionSerializer
from core.permissions import IsAdminUser


class InteractionAdminViewSet(viewsets.ModelViewSet):
    """
    ViewSet for admin interaction management (edit/delete)
    Separate from regular InteractionViewSet to have different permissions
    """
    serializer_class = InteractionSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Get all interactions with optional filtering"""
        queryset = Interaction.objects.all().select_related(
            'volunteer', 'team_member'
        ).order_by('-interaction_date')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(volunteer__full_name__icontains=search) |
                Q(discussion_notes__icontains=search) |
                Q(team_member__first_name__icontains=search) |
                Q(team_member__last_name__icontains=search)
            )
        
        # Filter by volunteer
        volunteer_id = self.request.query_params.get('volunteer', None)
        if volunteer_id:
            queryset = queryset.filter(volunteer_id=volunteer_id)
        
        # Filter by team member
        team_member_id = self.request.query_params.get('team_member', None)
        if team_member_id:
            queryset = queryset.filter(team_member_id=team_member_id)
        
        # Filter by follow-up status
        needs_followup = self.request.query_params.get('needs_followup', None)
        if needs_followup is not None:
            queryset = queryset.filter(needs_followup=needs_followup.lower() == 'true')
        
        return queryset
    
    def destroy(self, request, pk=None):
        """Delete an interaction"""
        interaction = self.get_object()
        interaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)