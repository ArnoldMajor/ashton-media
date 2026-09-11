from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from .models import Contract


@admin.register(Contract)
class ContractAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("client", "billboard", "date_range", "status", "created_by")
    list_filter = ("status",)
    search_fields = ("client__company_name", "billboard__site_code", "billboard__name")
    autocomplete_fields = ("billboard", "client", "created_by")

    allowed_view_roles = ["admin", "sales", "operations"]
    allowed_write_roles = ["admin", "sales"]
