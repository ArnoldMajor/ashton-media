from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from users.permissions import IsSales
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    # Admin and sales only, for reading as well as writing.
    permission_classes = [IsSales]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "industry", "account_manager"]