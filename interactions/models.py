from django.db import models
from django.conf import settings
from volunteers.models import Volunteer

class Interaction(models.Model):
    """
    Interaction between team member and volunteer
    """
    team_member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='interactions'
    )
    volunteer = models.ForeignKey(
        Volunteer,
        on_delete=models.CASCADE,
        related_name='interactions'
    )
    interaction_date = models.DateField()
    discussion_notes = models.TextField()
    topics = models.JSONField(default=list, blank=True)
    
    # Follow-up tracking
    needs_followup = models.BooleanField(default=False)
    followup_date = models.DateField(null=True, blank=True)
    followup_notes = models.TextField(blank=True, null=True)
    followup_completed = models.BooleanField(default=False)
    followup_completed_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'interactions'
        ordering = ['-interaction_date']
        indexes = [
            models.Index(fields=['volunteer']),
            models.Index(fields=['team_member']),
            models.Index(fields=['interaction_date']),
            models.Index(fields=['needs_followup', 'followup_completed']),
        ]
    
    def __str__(self):
        return f"{self.volunteer.full_name} - {self.interaction_date}"
    
    @property
    def is_followup_overdue(self):
        """Check if follow-up is overdue"""
        if self.needs_followup and not self.followup_completed and self.followup_date:
            from django.utils import timezone
            return self.followup_date < timezone.now().date()
        return False
    
    def complete_followup(self):
        """Mark follow-up as completed"""
        from django.utils import timezone
        self.followup_completed = True
        self.followup_completed_date = timezone.now().date()
        self.save()