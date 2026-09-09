from django.db.models.signals import post_save
from django.dispatch import receiver

from jobs.models import Job
from .models import Notification


@receiver(post_save, sender=Job)
def notify_on_job_assignment(sender, instance, created, **kwargs):
    if created and instance.assigned_to:
        Notification.objects.create(
            recipient=instance.assigned_to,
            title="New Job Assigned",
            message=f"You've been assigned a {instance.get_job_type_display()} job for {instance.billboard.site_code}.",
            link_url=f"/jobs/{instance.id}/",
        )