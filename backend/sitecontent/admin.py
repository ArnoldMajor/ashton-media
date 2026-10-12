from django.contrib import admin
from django.contrib.admin import ActionLocation
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.decorators import display

from users.admin_mixins import RoleBasedAdminMixin
from .forms import SiteImageForm
from .models import SiteImage
from .previews import is_stored, photo_previews, photo_size_text, without_preview

CUSTOM = "Custom image"
DEFAULT = "Using default image"


@admin.register(SiteImage)
class SiteImageAdmin(RoleBasedAdminMixin, ModelAdmin):
    form = SiteImageForm

    list_display = ("thumbnail", "title", "section", "spec", "photo_size", "status", "updated_at")
    list_display_links = ["title"]
    list_filter = ("section",)
    search_fields = ("title",)
    ordering = ("order",)

    fieldsets = (
        (None, {"fields": ("title", "section", "spec", "note", "key_display")}),
        ("Image", {"fields": ("image", "preview", "alt_text")}),
    )
    readonly_fields = ("title", "section", "spec", "note", "key_display", "preview")

    allowed_view_roles = ["admin", "design"]
    allowed_write_roles = ["admin", "design"]

    # Slots come from sitecontent/registry.py. Nobody adds or deletes one here,
    # superusers included, so these sit on the class and win over the mixin.
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request, action_location=ActionLocation.CHANGE_LIST):
        actions = super().get_actions(request, action_location=action_location)
        actions.pop("delete_selected", None)
        return actions

    def get_queryset(self, request):
        # A slot dropped from the registry is kept in the table but no longer
        # appears on the site, so there is nothing for an editor to do with it.
        return super().get_queryset(request).filter(active=True)

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        return fieldsets if obj and obj.image else without_preview(fieldsets)

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description="Image")
    def thumbnail(self, obj):
        if not obj.image:
            return "—"
        return format_html(
            '<img src="{}" alt="" loading="lazy" style="width:72px;height:48px;object-fit:cover;border-radius:4px;">',
            obj.image.url,
        )

    @admin.display(description="Spec")
    def spec(self, obj):
        return obj.spec_line

    @admin.display(description="Photo size")
    def photo_size(self, obj):
        return (obj.image and photo_size_text(obj.image_width, obj.image_height)) or "—"

    @display(description="Status", label={CUSTOM: "success", DEFAULT: "info"})
    def status(self, obj):
        return CUSTOM if obj.image else DEFAULT

    @admin.display(description="Key")
    def key_display(self, obj):
        return format_html('<code style="font-size:0.75rem;opacity:0.65;">{}</code>', obj.key)

    @admin.display(description="Preview")
    def preview(self, obj):
        # get_fieldsets drops this row when the slot has no image. An upload
        # that has just failed validation isn't in storage yet, so it isn't drawn.
        if not is_stored(obj.image):
            return ""
        return photo_previews(
            obj.image.url, obj.alt_text, obj.image_width, obj.image_height,
            ratio=(obj.ratio_w, obj.ratio_h), phone=obj.is_hero,
        )
