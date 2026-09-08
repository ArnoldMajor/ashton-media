from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from users.permissions import IsSalesOrReadOnly
from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsSalesOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "industry", "account_manager"]