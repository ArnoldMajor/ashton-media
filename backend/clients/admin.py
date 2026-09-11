from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from .models import Client


@admin.register(Client)
class ClientAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("company_name", "contact_name", "email", "status", "account_manager")
    list_filter = ("status", "industry")
    search_fields = ("company_name", "contact_name", "email", "phone")
    autocomplete_fields = ("account_manager",)

    allowed_view_roles = ["admin", "sales"]
    allowed_write_roles = ["admin", "sales"]
