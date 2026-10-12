from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteImage

SLOT_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string", "format": "uri"},
        "alt": {"type": "string"},
        "width": {"type": "integer"},
        "height": {"type": "integer"},
    },
    "required": ["url", "alt", "width", "height"],
}


class SiteContentView(APIView):
    """
    Images an editor has set for the fixed slots on the public site, keyed by
    slot key. A slot with no image is left out, and the site falls back to its
    built-in default for it.
    """

    # Public and read-only. No authentication at all, so a stale or malformed
    # token on the request can't turn it into a 401.
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="site_content_retrieve",
        summary="Site image slots",
        auth=[],
        responses={200: {"type": "object", "additionalProperties": SLOT_SCHEMA}},
        examples=[
            OpenApiExample(
                "One slot set",
                value={
                    "home.hero.ooh": {
                        "url": "https://cdn.example.com/site-images/home.hero.ooh/hero.jpg",
                        "alt": "Ashton Media out-of-home billboard",
                        "width": 3840,
                        "height": 2160,
                    },
                },
                response_only=True,
            ),
        ],
    )
    def get(self, request):
        slots = SiteImage.objects.filter(active=True).exclude(image="").exclude(image__isnull=True)
        return Response({
            slot.key: {
                # R2 URLs are already absolute; this only matters for local media.
                "url": request.build_absolute_uri(slot.image.url),
                "alt": slot.alt_text,
                "width": slot.image_width,
                "height": slot.image_height,
            }
            for slot in slots
        })
