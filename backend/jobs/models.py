from django.db import models
from django.conf import settings

# Create your models here.
class Job(models.Model):
    class JobType(models.TextChoices):
        INSTALLATION = "installation", "Installation"
        MAINTANANCE = "maintanance", "Maintanance"
        REMOVAL = "removal", "Removal"
        INSPECTION = "inspection", "Inspection"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    billboard = models.ForeignKey(
        "billboards.Billboard",
        on_delete=models.PROTECT,
        related_name="jobs",
    )

    contract = models.ForeignKey(
        "contracts.Contract",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_jobs",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jobs_created",
    )

    job_type = models.CharField(max_length=20, choices=JobType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)

    scheduled_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)

    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_date"]

    def __str__(self):
        return f"{self.get_job_type_display()} - {self.billboard.site_code}"