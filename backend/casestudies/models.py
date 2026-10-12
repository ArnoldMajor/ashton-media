from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models

from sitecontent.validation import ImageSpec

# How the public site draws a case study photo: a 4:3 panel, half the page wide.
PHOTO_SPEC = ImageSpec(ratio_w=4, ratio_h=3, max_mb=Decimal("1.0"))

DESCRIPTION_MAX_LENGTH = 500
MAX_METRICS = 3


def case_study_image_path(instance, filename):
    return f"case-studies/{filename}"


class CaseStudy(models.Model):
    brand = models.CharField(max_length=100)
    format_label = models.CharField(
        max_length=40,
        help_text='The badge above the brand name, e.g. "Digital OOH" or "Static + Digital".',
    )
    headline = models.CharField(max_length=160)
    description = models.TextField(
        validators=[MaxLengthValidator(DESCRIPTION_MAX_LENGTH)],
        help_text=f"Up to {DESCRIPTION_MAX_LENGTH} characters.",
    )

    image = models.ImageField(
        upload_to=case_study_image_path,
        width_field="image_width",
        height_field="image_height",
        blank=True,
        null=True,
    )
    image_width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    image_height = models.PositiveIntegerField(null=True, blank=True, editable=False)
    alt_text = models.CharField(max_length=200, blank=True)

    published = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        editable=False,
        related_name="case_studies",
    )

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Case study"
        verbose_name_plural = "Case studies"

    def __str__(self):
        return self.brand


class CaseStudyMetric(models.Model):
    case_study = models.ForeignKey(CaseStudy, on_delete=models.CASCADE, related_name="metrics")
    value = models.CharField(max_length=30, help_text='The big number, e.g. "+32%".')
    label = models.CharField(max_length=60, help_text='What it measures, e.g. "brand recall".')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Metric"
        verbose_name_plural = "Metrics"

    def __str__(self):
        return f"{self.value} {self.label}"
