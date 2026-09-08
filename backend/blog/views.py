from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from users.permissions import IsDesignOrReadOnly
from .models import BlogPost
from .serializers import BlogPostSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer
    permission_classes = [IsDesignOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]
    lookup_field = "slug"

    def get_queryset(self):
        qs = BlogPost.objects.select_related("author").all()
        if not self.request.user.is_authenticated:
            qs = qs.filter(status=BlogPost.Status.PUBLISHED)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)