from datetime import date, timedelta

from django.conf import settings

from billboards.models import Billboard
from contracts.models import Contract
from inquiries.models import Inquiry
from jobs.models import Job


def dashboard_callback(request, context):
    today = date.today()
    context.update({
        "total_billboards": Billboard.objects.count(),
        "available_billboards": Billboard.objects.filter(status=Billboard.Status.AVAILABLE).count(),
        "active_contracts": Contract.objects.filter(status=Contract.Status.ACTIVE).count(),
        "pending_jobs": Job.objects.filter(status=Job.Status.PENDING).count(),
        "jobs_this_week": Job.objects.filter(
            scheduled_date__range=(today, today + timedelta(days=7))
        ).count(),
        "new_inquiries": Inquiry.objects.filter(status=Inquiry.Status.NEW).count(),
        "recent_inquiries": Inquiry.objects.order_by("-created_at")[:5],
    })
    return context


def environment_callback(request):
    if settings.DEBUG:
        return ["Development", "warning"]
    return ["Production", "danger"]