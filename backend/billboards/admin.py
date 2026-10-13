from django.contrib import admin
from django.urls import path
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from .admin_availability import AvailabilityView
from .models import Billboard


@admin.register(Billboard)
class BillboardAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("site_code", "name", "format", "status", "region", "illuminated")
    list_display_links = ["name"]
    list_filter = ("format", "status", "region", "illuminated")
    search_fields = ("site_code", "name", "region", "address", "structure_code")

    allowed_view_roles = ["admin", "sales", "operations", "design"]
    allowed_write_roles = ["admin", "operations"]

    def get_urls(self):
        # Ahead of the built-in patterns: their "<path:object_id>/" would
        # otherwise take "availability/" for a billboard's id.
        return [
            path(
                "availability/",
                self.admin_site.admin_view(AvailabilityView.as_view(model_admin=self)),
                name="billboards_billboard_availability",
            ),
            *super().get_urls(),
        ]
