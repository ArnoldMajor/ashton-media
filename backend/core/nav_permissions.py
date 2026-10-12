from users.permissions import SALES_DATA_ROLES


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
