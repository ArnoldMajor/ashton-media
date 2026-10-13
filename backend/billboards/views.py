from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .pdf import TooManySitesError, check_site_count, render_availability_pdf
from .services import get_available_billboards

from users.permissions import IsAdminOrReadOnly
from .models import Billboard
from .serializers import BillboardSerializer, AvailabilityQuerySerializer, AvailabilityPDFQuerySerializer


class BillboardViewSet(viewsets.ModelViewSet):
    queryset = Billboard.objects.all()
    serializer_class = BillboardSerializer
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["region", "format", "status", "illuminated", "backlit", "structure_code"]


    @action(detail=False, methods=["get"])
    def available(self, request):
        query = AvailabilityQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        start = query.validated_data["start"]
        end = query.validated_data["end"]

        available_qs = get_available_billboards(start, end)

        serializer = BillboardSerializer(available_qs, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=["get"])
    def availability_pdf(self, request):
        query = AvailabilityPDFQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        start = query.validated_data["start"]
        end = query.validated_data["end"]
        report_type = query.validated_data["report_type"]

        billboards = get_available_billboards(start, end)

        try:
            check_site_count(billboards.count(), report_type)
        except TooManySitesError as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        pdf_bytes = render_availability_pdf(
            billboards, start, end, report_type, base_url=request.build_absolute_uri("/"),
        )

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="availability_{report_type}_{start}_to_{end}.pdf"'
        )
        return response