from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm

from users.admin_mixins import RoleBasedAdminMixin

from .forms import CustomUserChangeForm, CustomUserCreationForm
from .models import User


@admin.register(User)
class UserAdmin(RoleBasedAdminMixin, BaseUserAdmin, ModelAdmin):
    allowed_write_roles = ["admin"]
    allowed_view_roles = ["admin"]

    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = ("username", "email", "role", "department", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email", "employee_id")

    fieldsets = BaseUserAdmin.fieldsets + (
        ("Work Information", {
            "fields": ("role", "department", "position", "employee_id", "avatar"),
        }),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username", "email", "password1", "password2",
                "role", "department", "position", "employee_id", "is_staff",
            ),
        }),
    )
