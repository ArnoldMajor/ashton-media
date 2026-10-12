from django import forms
from django.contrib import admin
from unfold.admin import ModelAdmin

from users.admin_mixins import RoleBasedAdminMixin
from users.permissions import (
    OPERATIONS_ALLOWED_STATUSES,
    OPERATIONS_JOB_FIELDS,
    SALES_DATA_ROLES,
)
from .models import Job

# The form's fields in model order. Spelled out so the order is the same for
# every role, whichever of them are read-only.
JOB_FIELDS = (
    "billboard", "contract", "created_by", "assigned_to",
    "estimated_hours", "actual_hours",
    "job_type", "status", "priority",
    "scheduled_date", "completed_at", "description",
)


class JobAdminForm(forms.ModelForm):
    # JobAdmin.get_form sets this on the per-request form class for field crew.
    # None means any status is allowed.
    allowed_statuses = None

    class Meta:
        model = Job
        fields = "__all__"

    def clean_status(self):
        status = self.cleaned_data["status"]
        # The dropdown only offers the allowed statuses; this refuses a
        # hand-made request that sends another one.
        if self.allowed_statuses is not None and status not in self.allowed_statuses:
            raise forms.ValidationError(
                "You can set a job to Pending, In Progress or Completed. Only an admin can cancel a job."
            )
        return status


@admin.register(Job)
class JobAdmin(RoleBasedAdminMixin, ModelAdmin):
    """
    Who does what with jobs here:

    - Admin (and superusers): everything.
    - Operations, the field crew: see only the jobs assigned to them and can
      change only the status of those, to anything but Cancelled.
    - Sales and design: read-only.

    Anyone who may not see contracts (operations and design) is never shown the
    job's contract, because its label carries the client's name.
    """

    form = JobAdminForm

    list_display = ("billboard", "job_type", "status", "priority", "assigned_to", "scheduled_date")
    list_display_links = ["billboard"]
    list_filter = ("job_type", "status", "priority")
    search_fields = ("billboard__site_code", "billboard__name", "description")
    autocomplete_fields = ("billboard", "contract", "created_by", "assigned_to")

    allowed_view_roles = ["admin", "sales", "operations", "design"]
    # Add and delete are admin only. Change is widened for field crew below.
    allowed_write_roles = ["admin"]

    @staticmethod
    def _is_field_crew(request):
        return not request.user.is_superuser and request.user.role == "operations"

    @staticmethod
    def _can_see_contracts(request):
        return request.user.is_superuser or request.user.role in SALES_DATA_ROLES

    def has_change_permission(self, request, obj=None):
        if super().has_change_permission(request, obj):
            return True
        if not (request.user.is_authenticated and self._is_field_crew(request)):
            return False
        # Asked without a job, the question is "may this user change jobs at
        # all" (the changelist asks it). With one, it has to be theirs.
        return obj is None or obj.assigned_to_id == request.user.pk

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if self._is_field_crew(request):
            # Someone else's job is simply not there: not in the list, and its
            # change page says it doesn't exist.
            return queryset.filter(assigned_to=request.user)
        return queryset

    def get_fields(self, request, obj=None):
        return [name for name in JOB_FIELDS if name != "contract" or self._can_see_contracts(request)]

    def get_autocomplete_fields(self, request):
        fields = super().get_autocomplete_fields(request)
        return fields if self._can_see_contracts(request) else [name for name in fields if name != "contract"]

    def get_readonly_fields(self, request, obj=None):
        readonly = super().get_readonly_fields(request, obj)
        if not self._is_field_crew(request):
            return readonly
        editable = set(OPERATIONS_JOB_FIELDS)
        if obj is not None and obj.status == Job.Status.CANCELLED:
            # A cancelled job stays cancelled until an admin says otherwise.
            editable.discard("status")
        return [*readonly, *(name for name in self.get_fields(request, obj) if name not in editable)]

    def get_form(self, request, obj=None, **kwargs):
        # modelform_factory builds a new class on every call, so narrowing the
        # choices here affects this request's form only.
        form = super().get_form(request, obj, **kwargs)
        if self._is_field_crew(request):
            form.allowed_statuses = OPERATIONS_ALLOWED_STATUSES
            if "status" in form.base_fields:
                form.base_fields["status"].choices = [
                    choice for choice in Job.Status.choices if choice[0] in OPERATIONS_ALLOWED_STATUSES
                ]
        return form

    def save_model(self, request, obj, form, change):
        if change and self._is_field_crew(request):
            # Write the status column and nothing else, so nothing an admin
            # changed in the meantime is overwritten.
            obj.save(update_fields=[*OPERATIONS_JOB_FIELDS, "updated_at"])
            return
        super().save_model(request, obj, form, change)
