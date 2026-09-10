from typing import Optional
from rest_framework import serializers
from .models import BlogPost


class BlogPostSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = "__all__"
        read_only_fields = ["slug", "author", "created_at", "updated_at"]

    def get_author_name(self, obj) -> Optional[str]:
        if not obj.author:
            return None
        return obj.author.get_full_name() or obj.author.username