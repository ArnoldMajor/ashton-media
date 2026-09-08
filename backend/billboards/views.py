from datetime import timedelta

from django.shortcuts import render
from django.db.backends.postgresql.psycopg_any import DateRange
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from contracts.models import Contract
from users.permissions import IsAdminOrReadOnly
from .models import Billboard
from .serializers import BillboardSerializer, AvailabilityQuerySerializer


class BillboardViewSet(viewsets.ModelViewSet):
    queryset = Billboard.objects.all()
    serializer_class = BillboardSerializer
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["region", "format", "status", "illuminated", "backlit"]


    @action(detail=False, methods=["get"])
    def available(self, request):
        query = AvailabilityQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        start = query.validated_data["start"]
        end = query.validated_data["end"]

        # end is treated as the last inclusive day requested — extend by
        # one day to match Postgres's [start, end) range form.
        requested_range = DateRange(start, end + timedelta(days=1))

        booked_ids = Contract.objects.filter(
            status__in=[Contract.Status.DRAFT, Contract.Status.ACTIVE],
            date_range__overlap=requested_range,
        ).values_list("billboard_id", flat=True)

        available_qs = (
            Billboard.objects.filter(status=Billboard.Status.AVAILABLE)
            .exclude(id__in=booked_ids)
        )

        serializer = BillboardSerializer(available_qs, many=True)
        return Response(serializer.data)