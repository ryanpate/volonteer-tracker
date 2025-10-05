from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """
    Permission check for admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsActiveUser(permissions.BasePermission):
    """
    Permission check for active users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_active