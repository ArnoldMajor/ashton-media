from datetime import date, timedelta

from django.conf import settings

from billboards.models import Billboard
from core.nav_permissions import can_view_contracts, can_view_inquiries
from contracts.models import Contract
from inquiries.models import Inquiry
from jobs.models import Job


def dashboard_callback(request, context):
    today = date.today()
    context.update({
        "total_billboards": Billboard.objects.count(),
        "available_billboards": Billboard.objects.filter(status=Billboard.Status.AVAILABLE).count(),
        "pending_jobs": Job.objects.filter(status=Job.Status.PENDING).count(),
        "jobs_this_week": Job.objects.filter(
            scheduled_date__range=(today, today + timedelta(days=7))
        ).count(),
    })

    # Contract and inquiry figures are queried, and put in the context, only
    # for someone allowed to see them. For anyone else they are not there to leak.
    show_sales_data = can_view_contracts(request) and can_view_inquiries(request)
    context["show_sales_data"] = show_sales_data
    if show_sales_data:
        context.update({
            "active_contracts": Contract.objects.filter(status=Contract.Status.ACTIVE).count(),
            "new_inquiries": Inquiry.objects.filter(status=Inquiry.Status.NEW).count(),
            "recent_inquiries": Inquiry.objects.order_by("-created_at")[:5],
        })
    return context


def environment_callback(request):
    # A badge only where it is a warning: on a development server. In production
    # there is none. Unfold draws the badge inside {% if environment %}, so None
    # renders nothing at all, not an empty pill.
    if settings.DEBUG:
        return ["Development", "warning"]
    return None