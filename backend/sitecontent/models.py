from django.conf import settings
from django.db import models

from .validation import ImageSpec


def site_image_path(instance, filename):
    return f"site-images/{instance.key}/{filename}"


class SiteImage(models.Model):
    """
    One fixed image slot on the public site. Rows are created and described by
    sitecontent/registry.py through `manage.py sync_site_images`; editors only
    ever change `image` and `alt_text`.
    """

    key = models.CharField(max_length=100, unique=True, editable=False)
    title = models.CharField(max_length=200)
    section = models.CharField(max_length=100)
    order = models.PositiveIntegerField()

    ratio_w = models.PositiveSmallIntegerField()
    ratio_h = models.PositiveSmallIntegerField()
    min_width = models.PositiveIntegerField()
    min_height = models.PositiveIntegerField()
    max_mb = models.DecimalField(max_digits=4, decimal_places=1)

    default_alt = models.CharField(max_length=200, blank=True)
    alt_required = models.BooleanField(default=True)
    note = models.TextField(blank=True)
    active = models.BooleanField(default=True)

    image = models.ImageField(
        upload_to=site_image_path,
        width_field="image_width",
        height_field="image_height",
        blank=True,
        null=True,
    )
    image_width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    image_height = models.PositiveIntegerField(null=True, blank=True, editable=False)
    alt_text = models.CharField(max_length=200, blank=True)

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        editable=False,
        related_name="site_images",
    )

    class Meta:
        ordering = ["order"]
        verbose_name = "Site image"
        verbose_name_plural = "Site images"

    def __str__(self):
        return self.title

    @property
    def image_spec(self):
        return ImageSpec(
            ratio_w=self.ratio_w, ratio_h=self.ratio_h,
            min_width=self.min_width,
            max_mb=self.max_mb,
        )

    @property
    def spec_line(self):
        return self.image_spec.line

    @property
    def is_hero(self):
        """A home-page hero slide: full-screen, so it is cropped very differently on a phone."""
        return self.key.startswith("home.hero.")
