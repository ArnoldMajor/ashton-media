from django.conf import settings
from django.db import models

# Create your models here.
class Client(models.Model):
    class Status(models.TextChoices):
        PROSPECT = "prospect", "Prospect"
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    company_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROSPECT)

    account_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="clients",
    )

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        ordering = ["company_name"]

    def __str__(self):
        return self.company_name