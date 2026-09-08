from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from users.permissions import IsSales
from .models import Inquiry
from .serializers import InquirySerializer


class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.select_related("billboard").all()
    serializer_class = InquirySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "inquiry_type"]
    throttle_scope = "inquiries"

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsSales()]