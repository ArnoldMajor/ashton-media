from django.db import models
from django.conf import settings
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateRangeField, RangeOperators
from django.db import models
from django.db.models import F, Q

# Create your models here.
class Contract(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    billboard = models.ForeignKey(
        "billboards.Billboard",
        on_delete=models.PROTECT,
        related_name="contracts",
    )

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="contracts",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contracts_created",
    )

    date_range = DateRangeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        ordering = ["-created_at"]
        constraints = [
            ExclusionConstraint(
                name="exclude_overlapping_contracts",
                expressions=[
                    (F("billboard"), RangeOperators.EQUAL),
                    (F("date_range"), RangeOperators.OVERLAPS),
                ],
                condition=Q(status__in=["draft", "active"]),
            )
        ]

    def __str__(self):
        return f"{self.client.company_name} - {self.billboard.site_code}"