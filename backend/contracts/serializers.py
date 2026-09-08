from rest_framework import serializers

from billboards.serializers import BillboardSerializer
from clients.serializers import ClientSerializer
from .fields import DateRangeSerializerField
from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    date_range = DateRangeSerializerField()

    class Meta:
        model = Contract
        fields = [
            "id", "billboard", "client", "created_by",
            "date_range", "status", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["billboard"] = BillboardSerializer(instance.billboard).data
        rep["client"] = ClientSerializer(instance.client).data
        return rep

    def validate(self, data):
        billboard = data.get("billboard", getattr(self.instance, "billboard", None))
        date_range = data.get("date_range", getattr(self.instance, "date_range", None))
        status = data.get("status", getattr(self.instance, "status", Contract.Status.DRAFT))

        if status in [Contract.Status.DRAFT, Contract.Status.ACTIVE]:
            overlapping = Contract.objects.filter(
                billboard=billboard,
                status__in=[Contract.Status.DRAFT, Contract.Status.ACTIVE],
                date_range__overlap=date_range,
            )
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)
            if overlapping.exists():
                raise serializers.ValidationError(
                    {"date_range": "This billboard is already booked for an overlapping date range."}
                )
        return data