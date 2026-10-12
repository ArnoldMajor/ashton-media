from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CaseStudy

CASE_STUDY_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "integer"},
        "brand": {"type": "string"},
        "format_label": {"type": "string"},
        "headline": {"type": "string"},
        "description": {"type": "string"},
        "image": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "format": "uri"},
                "alt": {"type": "string"},
                "width": {"type": "integer"},
                "height": {"type": "integer"},
            },
            "required": ["url", "alt", "width", "height"],
        },
        "metrics": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"value": {"type": "string"}, "label": {"type": "string"}},
                "required": ["value", "label"],
            },
        },
    },
    "required": ["id", "brand", "format_label", "headline", "description", "image", "metrics"],
}


class CaseStudyListView(APIView):
    """
    Published case studies for the public site, in the order editors set.
    Drafts, and anything without a photo, are left out.
    """

    # Public and read-only. No authentication at all, so a stale or malformed
    # token on the request can't turn it into a 401.
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="case_studies_list",
        summary="Published case studies",
        auth=[],
        responses={200: {"type": "array", "items": CASE_STUDY_SCHEMA}},
        examples=[
            OpenApiExample(
                "One case study",
                value=[{
                    "id": 1,
                    "brand": "Vodacom Tanzania",
                    "format_label": "Digital",
                    "headline": "15M+ Impressions in 30 Days",
                    "description": "A 4-screen digital network campaign across Dar es Salaam's CBD.",
                    "image": {
                        "url": "https://cdn.example.com/case-studies/vodacom.jpg",
                        "alt": "Vodacom Tanzania",
                        "width": 1200,
                        "height": 900,
                    },
                    "metrics": [{"value": "15M+", "label": "impressions"}],
                }],
                response_only=True,
            ),
        ],
    )
    def get(self, request):
        # Model ordering puts these in (order, id); the prefetch keeps the
        # whole response at two queries however many there are.
        studies = (
            CaseStudy.objects.filter(published=True)
            .exclude(image="")
            .exclude(image__isnull=True)
            .prefetch_related("metrics")
        )
        return Response([
            {
                "id": study.id,
                "brand": study.brand,
                "format_label": study.format_label,
                "headline": study.headline,
                "description": study.description,
                "image": {
                    # R2 URLs are already absolute; this only matters for local media.
                    "url": request.build_absolute_uri(study.image.url),
                    "alt": study.alt_text,
                    "width": study.image_width,
                    "height": study.image_height,
                },
                "metrics": [{"value": metric.value, "label": metric.label} for metric in study.metrics.all()],
            }
            for study in studies
        ])
