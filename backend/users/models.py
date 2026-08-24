from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        SALES = "sales", "Sales"
        OPERATIONS = "operations", "Operations"
        DESIGN = "design", "Design"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SALES)
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=20, unique=True, blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    def __str__(self):
        return self.get_full_name() or self.username
