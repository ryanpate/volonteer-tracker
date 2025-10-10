from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Max
from .models import Volunteer
from .serializers import (
    VolunteerSerializer, VolunteerCreateSerializer,
    VolunteerUpdateSerializer, VolunteerSummarySerializer
)
from .services import PCOService, LLMService
from interactions.serializers import InteractionSerializer
import logging

logger = logging.getLogger(__name__)


class VolunteerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing volunteers
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    ordering_fields = ['last_name', 'first_name', 'created_at']
    ordering = ['last_name', 'first_name']

    def get_queryset(self):
        """
        Return volunteers, excluding archived by default
        Use ?show_archived=true to include archived volunteers
        """
        queryset = Volunteer.objects.annotate(
            interaction_count=Count('interactions'),
            last_interaction_date=Max('interactions__interaction_date')
        )

        # Check if we should show archived volunteers
        show_archived = self.request.query_params.get(
            'show_archived', 'false').lower() == 'true'

        if not show_archived:
            # Default: only show active volunteers
            queryset = queryset.filter(is_archived=False)

        return queryset.order_by('last_name', 'first_name')

    def get_serializer_class(self):
        if self.action == 'create':
            return VolunteerCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return VolunteerUpdateSerializer
        return VolunteerSerializer

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get volunteer with interaction history"""
        volunteer = self.get_object()
        interactions = volunteer.interactions.select_related(
            'team_member').order_by('-interaction_date')

        interaction_data = []
        for interaction in interactions:
            interaction_data.append({
                'id': interaction.id,
                'interaction_date': interaction.interaction_date,
                'discussion_notes': interaction.discussion_notes,
                'topics': interaction.topics,
                'needs_followup': interaction.needs_followup,
                'followup_date': interaction.followup_date,
                'followup_notes': interaction.followup_notes,
                'followup_completed': interaction.followup_completed,
                'team_member_first_name': interaction.team_member.first_name,
                'team_member_last_name': interaction.team_member.last_name,
            })

        serializer = VolunteerSerializer(volunteer)
        return Response({
            'volunteer': serializer.data,
            'interactions': interaction_data
        })

    @action(detail=True, methods=['get'])
    def teams(self, request, pk=None):
        """Fetch and update teams for a specific volunteer from PCO"""
        volunteer = self.get_object()

        if not volunteer.pco_person_id:
            return Response(
                {'error': 'This volunteer is not synced with PCO'},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(
            f"Fetching teams for volunteer {volunteer.full_name} (PCO ID: {volunteer.pco_person_id})")

        try:
            pco_service = PCOService()
            teams = pco_service.fetch_person_teams(volunteer.pco_person_id)

            logger.info(f"Teams fetched: {teams}")

            # Update volunteer with fetched teams
            volunteer.teams = teams
            volunteer.save(update_fields=['teams'])

            logger.info(f"Teams saved to database: {volunteer.teams}")

            return Response({'teams': teams})
        except Exception as e:
            logger.error(f"Error fetching teams: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to fetch teams: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Generate AI summary of volunteer interactions"""
        volunteer = self.get_object()
        interactions = volunteer.interactions.all()

        if not interactions.exists():
            return Response({
                'summary': 'No interactions recorded yet for this volunteer.'
            })

        try:
            llm_service = LLMService()
            summary = llm_service.summarize_interactions(
                interactions, volunteer)
            return Response({'summary': summary})
        except Exception as e:
            return Response(
                {'error': f'Failed to generate summary: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Sync volunteers from Planning Center Online"""
        try:
            pco_service = PCOService()
            result = pco_service.sync_volunteers()
            return Response(result)
        except Exception as e:
            return Response(
                {'error': f'Failed to sync volunteers: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
