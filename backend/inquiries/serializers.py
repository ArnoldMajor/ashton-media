from rest_framework import serializers
from .models import Inquiry


class InquirySerializer(serializers.ModelSerializer):
    inquiry_type_display = serializers.CharField(source="get_inquiry_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Inquiry
        fields = "__all__"
        read_only_fields = ["status", "created_at"]