from django.db.backends.postgresql.psycopg_any import DateRange
from rest_framework import serializers


class DateRangeSerializerField(serializers.Field):
    def to_internal_value(self, data):
        if not isinstance(data, dict) or "lower" not in data or "upper" not in data:
            raise serializers.ValidationError(
                "Expected an object with 'lower' and 'upper' date keys."
            )
        date_field = serializers.DateField()
        lower = date_field.to_internal_value(data["lower"])
        upper = date_field.to_internal_value(data["upper"])
        return DateRange(lower, upper)

    def to_representation(self, value):
        if value is None:
            return None
        return {
            "lower": value.lower.isoformat() if value.lower else None,
            "upper": value.upper.isoformat() if value.upper else None,
        }