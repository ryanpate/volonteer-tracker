from rest_framework import serializers
from .models import Interaction
from volunteers.serializers import VolunteerSerializer
from core.serializers import TeamMemberSerializer

class InteractionSerializer(serializers.ModelSerializer):
    """Serializer for interaction list and details"""
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)
    team_member_name = serializers.CharField(source='team_member.full_name', read_only=True)
    is_followup_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Interaction
        fields = [
            'id', 'team_member', 'team_member_name', 'volunteer', 'volunteer_name',
            'interaction_date', 'discussion_notes', 'topics',
            'needs_followup', 'followup_date', 'followup_notes',
            'followup_completed', 'followup_completed_date', 'is_followup_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'team_member', 'created_at', 'updated_at']

class InteractionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating interactions"""
    
    class Meta:
        model = Interaction
        fields = [
            'volunteer', 'interaction_date', 'discussion_notes', 'topics',
            'needs_followup', 'followup_date', 'followup_notes'
        ]
    
    def validate(self, attrs):
        if attrs.get('needs_followup') and not attrs.get('followup_date'):
            raise serializers.ValidationError({
                "followup_date": "Follow-up date is required when follow-up is needed."
            })
        return attrs

class InteractionUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating interactions"""
    
    class Meta:
        model = Interaction
        fields = [
            'interaction_date', 'discussion_notes', 'topics',
            'needs_followup', 'followup_date', 'followup_notes',
            'followup_completed', 'followup_completed_date'
        ]

class InteractionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with nested volunteer and team member"""
    volunteer = VolunteerSerializer(read_only=True)
    team_member = TeamMemberSerializer(read_only=True)
    is_followup_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Interaction
        fields = [
            'id', 'team_member', 'volunteer',
            'interaction_date', 'discussion_notes', 'topics',
            'needs_followup', 'followup_date', 'followup_notes',
            'followup_completed', 'followup_completed_date', 'is_followup_overdue',
            'created_at', 'updated_at'
        ]