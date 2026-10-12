from typing import Optional

from rest_framework import serializers

from users.permissions import (
    OPERATIONS_ALLOWED_STATUSES,
    OPERATIONS_JOB_FIELDS,
    user_can_see_sales_data,
)
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    job_type_display = serializers.CharField(source="get_job_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    billboard_site_code = serializers.CharField(source="billboard.site_code", read_only=True)

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def _request_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None)

    def get_fields(self):
        """
        Shapes the fields to the person asking. Done here, not in __init__: the
        child of a many=True serializer is built before it has a request.

        With no request in the context (a shell, a script, a unit test) there is
        nobody to shape them for, so every field is returned as declared.
        """
        fields = super().get_fields()
        user = self._request_user()
        if user is None:
            return fields

        if not user_can_see_sales_data(user):
            # The contract leads to the client. Gone from output and input alike.
            fields.pop("contract", None)

        if getattr(user, "role", None) == "operations":
            # Field crew may change only these. Anything else they send is
            # ignored, not rejected, and the stored values stay as they are.
            for name, field in fields.items():
                if name not in OPERATIONS_JOB_FIELDS:
                    field.read_only = True
        return fields

    def validate_status(self, value):
        user = self._request_user()
        if getattr(user, "role", None) != "operations":
            return value
        if self.instance is not None and self.instance.status == Job.Status.CANCELLED:
            raise serializers.ValidationError(
                "This job has been cancelled, so its status can no longer be changed. "
                "Ask an admin if it needs to be reopened."
            )
        if value not in OPERATIONS_ALLOWED_STATUSES:
            raise serializers.ValidationError(
                "You can set a job to Pending, In Progress or Completed. Only an admin can cancel a job."
            )
        return value

    def get_assigned_to_name(self, obj) -> Optional[str]:
        if not obj.assigned_to:
            return None
        return obj.assigned_to.get_full_name() or obj.assigned_to.username