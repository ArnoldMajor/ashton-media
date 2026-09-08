from rest_framework.permissions import BasePermission, SAFE_METHODS


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
    allowed_roles = ["admin","sales"]


class IsDesign(HasRole):
    allowed_roles = ["admin", "design"]