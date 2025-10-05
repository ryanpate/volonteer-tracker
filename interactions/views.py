from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Interaction
from .serializers import (
    InteractionSerializer, InteractionCreateSerializer,
    InteractionUpdateSerializer, InteractionDetailSerializer
)
from .filters import InteractionFilter

class InteractionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing interactions
    """
    queryset = Interaction.objects.select_related('volunteer', 'team_member').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = InteractionFilter
    ordering_fields = ['interaction_date', 'created_at']
    ordering = ['-interaction_date']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return InteractionCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return InteractionUpdateSerializer
        elif self.action == 'retrieve':
            return InteractionDetailSerializer
        return InteractionSerializer
    
    def perform_create(self, serializer):
        """Set the team_member to current user when creating"""
        serializer.save(team_member=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete_followup(self, request, pk=None):
        """Mark follow-up as completed"""
        interaction = self.get_object()
        interaction.complete_followup()
        return Response({
            'message': 'Follow-up marked as completed',
            'interaction': InteractionSerializer(interaction).data
        })
    
    @action(detail=False, methods=['get'])
    def pending_followups(self, request):
        """Get all pending follow-ups"""
        pending = Interaction.objects.filter(
            needs_followup=True,
            followup_completed=False
        ).select_related('volunteer', 'team_member').order_by('followup_date')
        
        serializer = self.get_serializer(pending, many=True)
        return Response({'followups': serializer.data})
    
    @action(detail=False, methods=['get'])
    def overdue_followups(self, request):
        """Get overdue follow-ups"""
        overdue = Interaction.objects.filter(
            needs_followup=True,
            followup_completed=False,
            followup_date__lt=timezone.now().date()
        ).select_related('volunteer', 'team_member').order_by('followup_date')
        
        serializer = self.get_serializer(overdue, many=True)
        return Response({'followups': serializer.data})