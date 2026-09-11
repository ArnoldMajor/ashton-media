from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from .models import Job


@admin.register(Job)
class JobAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("billboard", "job_type", "status", "priority", "assigned_to", "scheduled_date")
    list_filter = ("job_type", "status", "priority")
    search_fields = ("billboard__site_code", "billboard__name", "description")
    autocomplete_fields = ("billboard", "contract", "created_by", "assigned_to")

    allowed_view_roles = ["admin", "operations", "design"]
    allowed_write_roles = ["admin", "operations"]
