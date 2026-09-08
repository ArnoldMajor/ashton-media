from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from users.permissions import IsSalesOrReadOnly
from .models import Contract
from .serializers import ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related("billboard", "client").all()
    serializer_class = ContractSerializer
    permission_classes = [IsSalesOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "billboard", "client"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)