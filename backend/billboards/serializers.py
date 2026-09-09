from rest_framework import serializers
from .models import Billboard


class BillboardSerializer(serializers.ModelSerializer):
    format_display = serializers.CharField(source="get_format_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Billboard
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class AvailabilityQuerySerializer(serializers.Serializer):
    start = serializers.DateField()
    end = serializers.DateField()

    def validate(self, data):
        if data["start"] >= data["end"]:
            raise serializers.ValidationError("start must be before end.")
        return data


class AvailabilityPDFQuerySerializer(AvailabilityQuerySerializer):
    report_type = serializers.ChoiceField(choices=["list", "detailed"], default="list")