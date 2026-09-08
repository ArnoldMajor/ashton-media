from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Client
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]