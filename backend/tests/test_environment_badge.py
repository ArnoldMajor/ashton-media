"""
The environment badge in the admin header.

It is a warning that this is not the real site, so it shows on a development
server ("Development") and nowhere else. There is no "Production" badge.
"""
import re

import pytest
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage, storages
from django.test import Client as WebClient
from django.test import RequestFactory, override_settings
from django.urls import reverse

from core.dashboard import environment_callback

User = get_user_model()

ROLES = ["admin", "sales", "operations", "design", "superuser"]

# Unfold draws the badge with its label helper: a small uppercase pill. These
# classes are on every label whatever its colour, so this finds the element
# even if the text or the colour were to change.
BADGE = re.compile(r'<(?:span|a)\b[^>]*class="[^"]*\btext-\[11px\]\s+uppercase\b[^"]*"[^>]*>(.*?)</(?:span|a)>', re.S)


@pytest.fixture(autouse=True)
def local_media(settings, tmp_path):
    """Nothing here uploads a file, but no test in this project may be able to reach R2."""
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    }
    settings.MEDIA_ROOT = tmp_path
    assert type(storages["default"]) is FileSystemStorage


@pytest.fixture
def superuser(db):
    return User.objects.create_superuser(username="super_test", password="x", role="design")


@pytest.fixture
def user_for(admin_user, sales_user, operations_user, design_user, superuser):
    users = {
        "admin": admin_user,
        "sales": sales_user,
        "operations": operations_user,
        "design": design_user,
        "superuser": superuser,
    }
    return users.__getitem__


def admin_index(user):
    web = WebClient()
    web.force_login(user)
    response = web.get(reverse("admin:index"))
    assert response.status_code == 200
    return response


def badges(html):
    return [text.strip() for text in BADGE.findall(html)]


class TestCallback:
    def test_returns_nothing_when_debug_is_off(self):
        with override_settings(DEBUG=False):
            assert environment_callback(RequestFactory().get("/admin/")) is None

    def test_returns_the_development_badge_when_debug_is_on(self):
        with override_settings(DEBUG=True):
            assert environment_callback(RequestFactory().get("/admin/")) == ["Development", "warning"]


@pytest.mark.parametrize("role", ROLES)
class TestAdminIndex:
    def test_no_badge_and_no_production_text_when_debug_is_off(self, role, user_for):
        with override_settings(DEBUG=False):
            response = admin_index(user_for(role))
        html = response.content.decode()

        assert response.context["environment"] is None
        assert badges(html) == []
        assert "production" not in html.lower()
        assert "Development" not in html
        # A callback that returns nothing must not be printed as text either.
        assert ">None<" not in html

    def test_development_badge_when_debug_is_on(self, role, user_for):
        with override_settings(DEBUG=True):
            response = admin_index(user_for(role))
        html = response.content.decode()

        assert response.context["environment"] == ["Development", "warning"]
        assert badges(html) == ["Development"]
        assert "production" not in html.lower()
