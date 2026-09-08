from django.db.models import Avg, Count, DecimalField, F, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from users.permissions import IsOperationsOrReadOnly
from .models import Job
from .serializers import JobSerializer


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.select_related("billboard", "contract", "assigned_to", "created_by").all()
    serializer_class = JobSerializer
    permission_classes = [IsOperationsOrReadOnly]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "job_type", "priority", "assigned_to", "billboard"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def kpis(self, request):
        data = (
            Job.objects.filter(assigned_to__isnull=False)
            .values("assigned_to", "assigned_to__username", "assigned_to__first_name", "assigned_to__last_name")
            .annotate(
                total_jobs=Count("id"),
                completed_jobs=Count("id", filter=Q(status=Job.Status.COMPLETED)),
                avg_estimated_hours=Avg("estimated_hours"),
                avg_actual_hours=Avg("actual_hours"),
                avg_hours_variance=Avg(
                    F("actual_hours") - F("estimated_hours"),
                    output_field=DecimalField(max_digits=6, decimal_places=2),
                ),
            )
            .order_by("-total_jobs")
        )
        return Response(list(data))