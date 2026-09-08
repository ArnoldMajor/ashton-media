from rest_framework import serializers
from .models import Billboard


class BillboardSerializer(serializers.ModelSerializer):
    format_display = serializers.CharField(source="get_format_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Billboard
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]