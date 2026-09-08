from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from users.permissions import IsAdminOrReadOnly
from .models import Billboard
from .serializers import BillboardSerializer


class BillboardViewSet(viewsets.ModelViewSet):
    queryset = Billboard.objects.all()
    serializer_class = BillboardSerializer
    permission_classes = [IsAdminOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["region", "format", "status", "illuminated", "backlit"]