from django.urls import reverse

from users.permissions import SALES_DATA_ROLES


def billboards_link_is_active(request):
    """
    Whether the sidebar highlights "Billboards". Unfold's own rule lights a
    link whenever its address is the start of the page's, and the Availability
    page lives under the billboards address, so both links lit up there. This
    is that rule with the Availability page left out.
    """
    return (
        request.path.startswith(reverse("admin:billboards_billboard_changelist"))
        and not request.path.startswith(reverse("admin:billboards_billboard_availability"))
    )


def can_view_availability(request):
    return request.user.is_superuser or request.user.role in SALES_DATA_ROLES


def can_view_blog(request):
    return request.user.is_superuser or request.user.role in ["admin", "design"]


def can_view_case_studies(request):
    return request.user.is_superuser or request.user.role in ["admin", "design"]


def can_view_clients(request):
    return request.user.is_superuser or request.user.role in SALES_DATA_ROLES


def can_view_contracts(request):
    return request.user.is_superuser or request.user.role in SALES_DATA_ROLES


def can_view_inquiries(request):
    return request.user.is_superuser or request.user.role in SALES_DATA_ROLES


def can_view_site_images(request):
    return request.user.is_superuser or request.user.role in ["admin", "design"]


def can_view_users(request):
    return request.user.is_superuser or request.user.role == "admin"
