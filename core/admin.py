# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import TeamMember

@admin.register(TeamMember)
class TeamMemberAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )


