from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from .models import Billboard


@admin.register(Billboard)
class BillboardAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("site_code", "name", "format", "status", "region", "illuminated")
    list_filter = ("format", "status", "region", "illuminated")
    search_fields = ("site_code", "name", "region", "address", "structure_code")

    allowed_view_roles = ["admin", "sales", "operations", "design"]
    allowed_write_roles = ["admin", "operations"]
