from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from sitecontent.previews import is_stored, photo_previews, photo_size_text, without_preview
from users.admin_mixins import RoleBasedAdminMixin
from .forms import CaseStudyForm
from .models import MAX_METRICS, PHOTO_SPEC, CaseStudy, CaseStudyMetric

EDITOR_ROLES = ["admin", "design"]

PUBLISHED = "Published"
DRAFT = "Draft"


class CaseStudyMetricInline(RoleBasedAdminMixin, TabularInline):
    model = CaseStudyMetric
    fields = ("value", "label", "order")
    extra = 1
    max_num = MAX_METRICS

    # Metrics belong to the case study, so the same roles edit both. Without
    # this the inline falls back to Django model permissions, which role
    # accounts don't hold, and they would see the metrics read-only.
    allowed_view_roles = EDITOR_ROLES
    allowed_write_roles = EDITOR_ROLES

    # The mixin's version has ModelAdmin's signature; an inline is also handed
    # the parent object.
    def has_add_permission(self, request, obj=None):
        return self._role_allowed(request, self.allowed_write_roles)

    def get_formset(self, request, obj=None, **kwargs):
        # max_num only limits the rows drawn. validate_max is what turns a
        # fourth submitted metric into an error.
        return super().get_formset(request, obj, validate_max=True, **kwargs)


@admin.register(CaseStudy)
class CaseStudyAdmin(RoleBasedAdminMixin, ModelAdmin):
    form = CaseStudyForm
    inlines = [CaseStudyMetricInline]

    list_display = ("thumbnail", "brand", "headline", "format_label", "photo_size", "status", "order")
    list_display_links = ["brand"]
    list_filter = ("published",)
    search_fields = ("brand", "headline")

    # Drag rows in the list to reorder, then Save. The handle replaces the
    # number box; set hide_ordering_field to False to bring the box back.
    ordering_field = "order"
    hide_ordering_field = True

    fieldsets = (
        (None, {"fields": ("brand", "format_label", "headline", "description")}),
        ("Photo", {"fields": ("image", "preview", "alt_text")}),
        ("Visibility", {"fields": ("published",)}),
    )
    readonly_fields = ("preview",)

    allowed_view_roles = EDITOR_ROLES
    allowed_write_roles = EDITOR_ROLES

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        return fieldsets if obj and obj.image else without_preview(fieldsets)

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    @admin.display(description="Photo")
    def thumbnail(self, obj):
        if not obj.image:
            return "—"
        return format_html(
            '<img src="{}" alt="" loading="lazy" style="width:64px;height:48px;object-fit:cover;border-radius:4px;">',
            obj.image.url,
        )

    @admin.display(description="Photo size")
    def photo_size(self, obj):
        return (obj.image and photo_size_text(obj.image_width, obj.image_height)) or "—"

    @display(description="Status", label={PUBLISHED: "success", DRAFT: "warning"})
    def status(self, obj):
        return PUBLISHED if obj.published else DRAFT

    @admin.display(description="Preview")
    def preview(self, obj):
        # get_fieldsets drops this row when there is no photo. An upload that
        # has just failed validation isn't in storage yet, so it isn't drawn.
        if not is_stored(obj.image):
            return ""
        return photo_previews(
            obj.image.url, obj.alt_text, obj.image_width, obj.image_height,
            ratio=(PHOTO_SPEC.ratio_w, PHOTO_SPEC.ratio_h),
        )
