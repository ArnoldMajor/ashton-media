from rest_framework.permissions import BasePermission, SAFE_METHODS

from jobs.models import Job

# Who may see client, contract and inquiry data, anywhere: admin pages, the
# API, the dashboard and the sidebar all read this one list.
SALES_DATA_ROLES = ["admin", "sales"]

# What field crew (the operations role) may change on a job assigned to them,
# and the statuses they may move it to. Cancelling is an admin's decision.
OPERATIONS_JOB_FIELDS = ["status"]
OPERATIONS_ALLOWED_STATUSES = [Job.Status.PENDING, Job.Status.IN_PROGRESS, Job.Status.COMPLETED]


def user_can_see_sales_data(user):
    """True only for a signed-in user whose role is admin or sales. Being a superuser is not enough."""
    return bool(user and user.is_authenticated and getattr(user, "role", None) in SALES_DATA_ROLES)


class HasRole(BasePermission):
    """
    Base class - subclass and set 'allowed_roles' to a list of role values.
    """

    allowed_roles = []

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in self.allowed_roles
        )


class IsAdmin(HasRole):
    allowed_roles = ["admin"]


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == "admin"


class IsSales(HasRole):
    allowed_roles = SALES_DATA_ROLES


class IsSalesOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["admin", "sales"]


class IsDesign(HasRole):
    allowed_roles = ["admin", "design"]


class IsDesignOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ["admin", "design"]


class IsOperationsOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["admin", "operations"]


class JobPermission(BasePermission):
    """
    Jobs over the API. Role alone decides; there is no superuser bypass.

    - Reading: any signed-in user (JobViewSet narrows operations to their own jobs).
    - Creating, replacing (PUT) and deleting: admin only.
    - PATCH: admin, or operations on a job assigned to them. JobSerializer
      limits what operations can actually change to OPERATIONS_JOB_FIELDS.
    - The kpis action compares every crew member, so operations may not read it.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if getattr(view, "action", None) == "kpis":
            return user.role != "operations"
        if request.method in SAFE_METHODS:
            return True
        if request.method == "PATCH":
            return user.role in ["admin", "operations"]
        return user.role == "admin"

    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in SAFE_METHODS or user.role == "admin":
            return True
        return request.method == "PATCH" and user.role == "operations" and obj.assigned_to_id == user.pk

