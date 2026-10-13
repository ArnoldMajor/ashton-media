"""
The admin's Availability page: which sites are free between two dates, and the
availability PDFs for the ones ticked.

Every "is it free" decision is billboards.services.get_available_billboards.
This module only narrows its result with the page's filters and counts.
"""
import logging
from datetime import timedelta
from urllib.parse import urlencode

from django import forms
from django.contrib import messages
from django.db.models import Count, Q
from django.http import HttpResponse, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils import timezone
from django.views import View
from unfold.views import UnfoldModelAdminViewMixin
from unfold.widgets import (
    CHECKBOX_CLASSES,
    UnfoldAdminSelectWidget,
    UnfoldAdminSingleDateWidget,
    UnfoldAdminTextInputWidget,
)

from core.nav_permissions import can_view_availability

from .models import Billboard
from .pdf import TooManySitesError, check_site_count, render_availability_pdf
from .services import get_available_billboards

logger = logging.getLogger(__name__)

DEFAULT_RANGE_DAYS = 30
FILTER_FIELDS = ["start", "end", "format", "region", "q"]
REPORT_TYPES = ["list", "detailed"]


class DateInput(UnfoldAdminSingleDateWidget):
    """Unfold's date field as a native date input: a calendar with no script, and the phone's own picker."""

    input_type = "date"

    def __init__(self, attrs=None):
        super().__init__(attrs=attrs, format="%Y-%m-%d")


class AvailabilityForm(forms.Form):
    start = forms.DateField(label="First day", widget=DateInput, error_messages={
        "required": "Choose the first day.", "invalid": "Enter the first day as a date.",
    })
    end = forms.DateField(label="Last day (inclusive)", widget=DateInput, error_messages={
        "required": "Choose the last day.", "invalid": "Enter the last day as a date.",
    })
    format = forms.ChoiceField(
        label="Format", required=False, widget=UnfoldAdminSelectWidget,
        choices=[("", "All formats"), *Billboard.Format.choices],
        error_messages={"invalid_choice": "Choose a format from the list."},
    )
    region = forms.ChoiceField(
        label="Region", required=False, widget=UnfoldAdminSelectWidget,
        error_messages={"invalid_choice": "Choose a region from the list."},
    )
    q = forms.CharField(
        label="Search", required=False, max_length=100,
        widget=UnfoldAdminTextInputWidget(attrs={
            "placeholder": "Site code or name",
            "title": "Matches the site code, name, structure code or address",
        }),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # order_by replaces the model's default ordering, which would otherwise defeat distinct().
        regions = Billboard.objects.order_by("region").values_list("region", flat=True).distinct()
        self.fields["region"].choices = [("", "All regions"), *((region, region) for region in regions)]

    def clean(self):
        cleaned = super().clean()
        start, end = cleaned.get("start"), cleaned.get("end")
        if start and end and end < start:
            self.add_error("end", "The last day must be on or after the first day.")
        return cleaned


def default_filters():
    start = timezone.localdate()
    return {"start": start.isoformat(), "end": (start + timedelta(days=DEFAULT_RANGE_DAYS)).isoformat()}


def apply_filters(queryset, cleaned):
    """Narrows a Billboard queryset by the form's format, region and search text."""
    if cleaned["format"]:
        queryset = queryset.filter(format=cleaned["format"])
    if cleaned["region"]:
        queryset = queryset.filter(region=cleaned["region"])
    if query := cleaned["q"].strip():
        queryset = queryset.filter(
            Q(site_code__icontains=query) | Q(name__icontains=query)
            | Q(structure_code__icontains=query) | Q(address__icontains=query)
        )
    return queryset


def size_text(billboard):
    """ "6m × 3m", or "—" for a site with no size on record. """
    if not (billboard.width_meters and billboard.height_meters):
        return "—"
    return f"{billboard.width_meters.normalize():f}m × {billboard.height_meters.normalize():f}m"


def find_results(cleaned):
    """
    The sites free for the form's dates and filters, with the counts for the
    line above the table. Two queries, however many sites there are.
    """
    counts = apply_filters(Billboard.objects.all(), cleaned).aggregate(
        total=Count("pk"), on_sale=Count("pk", filter=Q(status=Billboard.Status.AVAILABLE)),
    )
    available = list(apply_filters(get_available_billboards(cleaned["start"], cleaned["end"]), cleaned))
    rows = [
        {
            "billboard": billboard,
            "url": reverse("admin:billboards_billboard_change", args=[billboard.pk]),
            "size": size_text(billboard),
            "has_photo": bool(billboard.image),
        }
        for billboard in available
    ]
    return {
        "rows": rows,
        "available": len(rows),
        # On sale, but under a draft or active contract somewhere in these dates.
        "booked": counts["on_sale"] - len(rows),
        # Under maintenance or unavailable.
        "not_for_sale": counts["total"] - counts["on_sale"],
        "without_photo": sum(1 for row in rows if not row["has_photo"]),
    }


class AvailabilityView(UnfoldModelAdminViewMixin, View):
    """
    GET shows the page; POST returns a PDF of the ticked sites. Unfold's mixin
    supplies the admin layout: sidebar, header and the breadcrumb.

    Role accounts hold no Django model permissions, so the mixin's
    permission_required is not used: has_permission asks the same role check
    as the sidebar link, for GET and POST alike, and anyone else gets a 403.
    """

    title = "Availability"
    template_name = "admin/billboards/billboard/availability.html"

    def has_permission(self):
        return can_view_availability(self.request)

    def get(self, request):
        form = AvailabilityForm(request.GET if request.GET else default_filters())
        context = self.get_context_data(
            form=form,
            results=find_results(form.cleaned_data) if form.is_valid() else None,
            filters={name: form.data.get(name, "") for name in FILTER_FIELDS},
            checkbox_class=" ".join(CHECKBOX_CLASSES),
        )
        return TemplateResponse(request, self.template_name, context)

    def post(self, request):
        filters = {name: request.POST.get(name, "") for name in FILTER_FIELDS}
        form = AvailabilityForm(filters)
        if not form.is_valid():
            return self.back(filters, "Check the dates and filters, then try again.")

        report_type = request.POST.get("report_type")
        if report_type not in REPORT_TYPES:
            return self.back(filters, "Choose the list report or the detailed report.")

        start, end = form.cleaned_data["start"], form.cleaned_data["end"]
        ticked = {int(value) for value in request.POST.getlist("ids") if value.isascii() and value.isdigit()}
        # Only what is free today for these dates can be in a report, whatever
        # ids were posted: a stale page or a crafted request cannot add a
        # booked or unavailable site.
        billboards = list(get_available_billboards(start, end).filter(pk__in=ticked))
        if not billboards:
            return self.back(filters, "Tick at least one available site.")

        try:
            check_site_count(len(billboards), report_type)
        except TooManySitesError as error:
            return self.back(filters, str(error))

        try:
            pdf_bytes = render_availability_pdf(
                billboards, start, end, report_type, base_url=request.build_absolute_uri("/"),
            )
        except Exception:
            logger.exception("Availability PDF failed: %s report, %d sites", report_type, len(billboards))
            return self.back(filters, "The PDF could not be generated. Try fewer sites.")

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="availability_{report_type}_{start}_to_{end}.pdf"'
        return response

    def back(self, filters, error):
        """Back to the page with the same filters, and `error` shown at the top."""
        messages.error(self.request, error)
        query = urlencode({name: value for name, value in filters.items() if value})
        url = reverse("admin:billboards_billboard_availability")
        return HttpResponseRedirect(f"{url}?{query}" if query else url)
