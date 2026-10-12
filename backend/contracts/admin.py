from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from users.permissions import SALES_DATA_ROLES
from .models import Contract


@admin.register(Contract)
class ContractAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("client", "billboard", "date_range", "status", "created_by")
    list_display_links = ["billboard"]
    list_filter = ("status",)
    search_fields = ("client__company_name", "billboard__site_code", "billboard__name")
    autocomplete_fields = ("billboard", "client", "created_by")

    allowed_view_roles = SALES_DATA_ROLES
    allowed_write_roles = ["admin", "sales"]
