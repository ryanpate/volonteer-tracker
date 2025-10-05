from rest_framework import serializers
from .models import Volunteer

class VolunteerSerializer(serializers.ModelSerializer):
    """Serializer for volunteer list and details"""
    full_name = serializers.ReadOnlyField()
    interaction_count = serializers.ReadOnlyField()
    last_interaction_date = serializers.ReadOnlyField()
    days_since_last_interaction = serializers.ReadOnlyField()
    
    class Meta:
        model = Volunteer
        fields = [
            'id', 'pco_person_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'address', 'notes',
            'interaction_count', 'last_interaction_date', 
            'days_since_last_interaction',
            'last_synced_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_synced_at']

class VolunteerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating volunteers manually"""
    
    class Meta:
        model = Volunteer
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'address', 'notes'
        ]

class VolunteerUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating volunteer information"""
    
    class Meta:
        model = Volunteer
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'address', 'notes'
        ]
        
class VolunteerSummarySerializer(serializers.Serializer):
    """Serializer for volunteer interaction summary"""
    summary = serializers.CharField()