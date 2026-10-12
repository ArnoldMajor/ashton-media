from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from users.permissions import SALES_DATA_ROLES
from .models import Inquiry


@admin.register(Inquiry)
class InquiryAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("name", "email", "inquiry_type", "status", "billboard", "created_at")
    list_display_links = ["name"]
    list_filter = ("inquiry_type", "status")
    search_fields = ("name", "email", "company", "message")
    autocomplete_fields = ("billboard",)

    allowed_view_roles = SALES_DATA_ROLES
    allowed_write_roles = ["admin", "sales"]
