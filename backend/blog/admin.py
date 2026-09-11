from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(RoleBasedAdminMixin, ModelAdmin):
    list_display = ("title", "author", "status", "published_at", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "excerpt", "content")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("author",)

    allowed_view_roles = ["admin", "design", "sales"]
    allowed_write_roles = ["admin", "design"]
