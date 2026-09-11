class RoleBasedAdminMixin:
    """
    Gate admin view/write access by request.user.role.

    Set `allowed_view_roles` and/or `allowed_write_roles` on the ModelAdmin
    subclass to a list of User.Role values (e.g. ["admin", "sales"]).
    Superusers always have full access. Leaving a roles list empty falls
    back to Django's default permission check for that action.
    """

    allowed_view_roles = []
    allowed_write_roles = []

    def _role_allowed(self, request, roles):
        if not roles:
            return None
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and request.user.role in roles

    def has_module_permission(self, request):
        allowed = self._role_allowed(request, self.allowed_view_roles or self.allowed_write_roles)
        if allowed is None:
            return super().has_module_permission(request)
        return allowed

    def has_view_permission(self, request, obj=None):
        allowed = self._role_allowed(request, self.allowed_view_roles or self.allowed_write_roles)
        if allowed is None:
            return super().has_view_permission(request, obj)
        return allowed

    def has_add_permission(self, request):
        allowed = self._role_allowed(request, self.allowed_write_roles)
        if allowed is None:
            return super().has_add_permission(request)
        return allowed

    def has_change_permission(self, request, obj=None):
        allowed = self._role_allowed(request, self.allowed_write_roles)
        if allowed is None:
            return super().has_change_permission(request, obj)
        return allowed

    def has_delete_permission(self, request, obj=None):
        allowed = self._role_allowed(request, self.allowed_write_roles)
        if allowed is None:
            return super().has_delete_permission(request, obj)
        return allowed
