# interactions/admin.py
from django.contrib import admin
from .models import Interaction


@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = [
        'volunteer', 'team_member', 'interaction_date',
        'needs_followup', 'followup_date', 'followup_completed'
    ]
    list_filter = [
        'interaction_date', 'needs_followup', 'followup_completed',
        'team_member'
    ]
    search_fields = [
        'volunteer__first_name', 'volunteer__last_name',
        'team_member__first_name', 'team_member__last_name',
        'discussion_notes'
    ]
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'interaction_date'

    fieldsets = (
        ('Interaction Details', {
            'fields': ('team_member', 'volunteer', 'interaction_date', 'discussion_notes', 'topics')
        }),
        ('Follow-up', {
            'fields': ('needs_followup', 'followup_date', 'followup_notes',
                       'followup_completed', 'followup_completed_date')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new
            obj.team_member = request.user
        super().save_model(request, obj, form, change)
