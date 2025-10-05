import django_filters
from .models import Interaction


class InteractionFilter(django_filters.FilterSet):
    """Filters for interaction list"""
    volunteer = django_filters.NumberFilter(field_name='volunteer__id')
    team_member = django_filters.NumberFilter(field_name='team_member__id')
    start_date = django_filters.DateFilter(
        field_name='interaction_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(
        field_name='interaction_date', lookup_expr='lte')
    needs_followup = django_filters.BooleanFilter(field_name='needs_followup')
    followup_completed = django_filters.BooleanFilter(
        field_name='followup_completed')

    class Meta:
        model = Interaction
        fields = ['volunteer', 'team_member', 'start_date',
                  'end_date', 'needs_followup', 'followup_completed']
