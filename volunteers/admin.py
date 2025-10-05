
# volunteers/admin.py
from django.contrib import admin
from .models import Volunteer


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone',
                    'interaction_count', 'last_interaction_date']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    list_filter = ['last_synced_at', 'created_at']
    readonly_fields = ['pco_person_id',
                       'last_synced_at', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Address', {
            'fields': ('address',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('PCO Integration', {
            'fields': ('pco_person_id', 'last_synced_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
