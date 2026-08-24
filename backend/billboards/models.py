from django.db import models

# Create your models here.
class Billboard(models.Model):
    class Format(models.TextChoices):
        STATIC = "static", "Static"
        DIGITAL = "digital", "Digital"
        LIGHT_POLE = "light_pole", "Light Pole"
        AIRPORT = "airport", "Airport"
        STATION = "station", "Station"

    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        UNDER_MAINTANANCE = "under_maintanance", "Under Maintanance"
        UNAVAILABLE = "unavailable", "Unavailable"

    site_code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    format = models.CharField(max_length=20, choices=Format.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE)

    region = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    width_meters = models.DecimalField(max_digits=5, decimal_places=2)
    height_meters = models.DecimalField(max_digits=5, decimal_places=2)
    illuminated = models.BooleanField(default=False)
    backlit = models.BooleanField(default=False)

    image = models.ImageField(upload_to="billboards/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["site_code"]

    def __str__(self):
        return f"{self.site_code} - {self.name}"