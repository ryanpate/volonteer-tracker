from django.db import models
from django.utils import timezone

class Volunteer(models.Model):
    """
    Volunteer model - synced from Planning Center Online or manually created
    """
    pco_person_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Store array of team names
    teams = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'volunteers'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['pco_person_id']),
            models.Index(fields=['last_name', 'first_name']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def days_since_last_interaction(self):
        """Calculate days since last interaction"""
        from interactions.models import Interaction
        last_interaction = self.interactions.order_by('-interaction_date').first()
        if last_interaction:
            return (timezone.now().date() - last_interaction.interaction_date).days
        return None
    
    @property
    def interaction_count(self):
        """Total number of interactions"""
        return self.interactions.count()
    
    @property
    def last_interaction_date(self):
        """Date of most recent interaction"""
        last_interaction = self.interactions.order_by('-interaction_date').first()
        return last_interaction.interaction_date if last_interaction else None