from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import update_session_auth_hash
from .models import TeamMember
from .serializers import (
    TeamMemberSerializer, TeamMemberCreateSerializer,
    ChangePasswordSerializer, UserProfileSerializer
)
from .permissions import IsAdminUser


class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing team members (admin only)
    """
    queryset = TeamMember.objects.all()
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return TeamMemberCreateSerializer
        return TeamMemberSerializer

    def get_queryset(self):
        """Get all team members, optionally filtered"""
        queryset = TeamMember.objects.all().order_by('-created_at')

        # Optional filtering
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)

        return queryset

    def destroy(self, request, pk=None):
        """Delete a team member with safety checks"""
        team_member = self.get_object()

        # Prevent deleting yourself
        if team_member.id == request.user.id:
            return Response(
                {"error": "Cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has interactions
        from interactions.models import Interaction
        interaction_count = Interaction.objects.filter(
            team_member=team_member).count()
        if interaction_count > 0:
            return Response(
                {
                    "error": f"Cannot delete team member with {interaction_count} interactions. Deactivate instead.",
                    "interaction_count": interaction_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        team_member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a team member"""
        team_member = self.get_object()
        if team_member == request.user:
            return Response(
                {"error": "Cannot deactivate your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        team_member.is_active = False
        team_member.save()
        return Response({"message": "Team member deactivated successfully"})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a team member"""
        team_member = self.get_object()
        team_member.is_active = True
        team_member.save()
        return Response({"message": "Team member activated successfully"})

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Reset team member's password (admin only)"""
        team_member = self.get_object()
        new_password = request.data.get('new_password')

        if not new_password or len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )

        team_member.set_password(new_password)
        team_member.save()
        return Response({"message": "Password reset successfully"})


class AuthViewSet(viewsets.ViewSet):
    """
    Authentication endpoints
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new team member"""
        serializer = TeamMemberCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                TeamMemberSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change password for current user"""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            # Check current password
            if not user.check_password(serializer.data.get('current_password')):
                return Response(
                    {"error": "Current password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set new password
            user.set_password(serializer.data.get('new_password'))
            user.save()

            # Keep user logged in after password change
            update_session_auth_hash(request, user)

            return Response({"message": "Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
