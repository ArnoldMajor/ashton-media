from datetime import timedelta

from django.db.backends.postgresql.psycopg_any import DateRange

from contracts.models import Contract
from .models import Billboard


def get_available_billboards(start, end):
    """
    Returns billboards with status=AVAILABLE and no draft/active contract
    overlapping the given inclusive date range [start, end].
    """
    requested_range = DateRange(start, end + timedelta(days=1))

    booked_ids = Contract.objects.filter(
        status__in=[Contract.Status.DRAFT, Contract.Status.ACTIVE],
        date_range__overlap=requested_range,
    ).values_list("billboard_id", flat=True)

    return Billboard.objects.filter(status=Billboard.Status.AVAILABLE).exclude(id__in=booked_ids)