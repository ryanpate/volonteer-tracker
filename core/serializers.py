from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import TeamMember

class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for team member details"""
    full_name = serializers.ReadOnlyField()
    interaction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'is_active', 'created_at',
            'interaction_count'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_interaction_count(self, obj):
        return obj.interactions.count()

class TeamMemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating team members"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = TeamMember.objects.create_user(**validated_data)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (current user)"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'is_active'
        ]
        read_only_fields = ['id', 'role']