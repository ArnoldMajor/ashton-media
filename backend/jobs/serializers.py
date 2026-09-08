from rest_framework import serializers
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

    def get_assigned_to_name(self, obj):
        if not obj.assigned_to:
            return None
        return obj.assigned_to.get_full_name() or obj.assigned_to.username