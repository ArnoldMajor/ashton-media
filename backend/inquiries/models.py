from django.db import models

# Create your models here.
class Inquiry(models.Model):
    class InquiryType(models.TextChoices):
        GENERAL = "general", "General"
        CAMPAIGN = "campaign", "Campaign"
        AVAILABILITY = "availability", "Billboard Availability"

    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        CLOSED = "closed", "Closed"
        LOST = "lost", "Lost"

    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=200, blank=True)

    inquiry_type = models.CharField(max_length=20, choices=InquiryType.choices, default=InquiryType.GENERAL)
    billboard = models.ForeignKey(
        "billboards.Billboard",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries",
    )

    message = models.TextField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Inquiries"

    def __str__(self):
        return f"{self.name} - {self.get_inquiry_type_display()}"