import copy
from decimal import Decimal
import io
import os
import re
import urllib.request
from io import StringIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage, storages
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import RequestFactory
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from core.nav_permissions import can_view_site_images
from sitecontent import forms as site_image_forms
from sitecontent import registry
from sitecontent.management.commands import seed_site_images as seed
from sitecontent.models import SiteImage
from sitecontent.previews import PHOTO_HELP

User = get_user_model()


def mentions_size_or_shape_rule(text):
    """
    True if the text compares a photo with a ratio, a tolerance or a pixel
    minimum. Whole words, so "duration" doesn't count as "ratio".
    """
    return bool(re.search(r"\bratio\b|\bwithin \d+%|px wide|\bat least \d", text, re.IGNORECASE))


CHANGELIST = "admin:sitecontent_siteimage_changelist"
HERO_KEY = "home.hero.ooh"  # shown at 16:9, max 3 MB, alt required
BANNER_KEY = "traditional.banner"  # shown at 21:9, max 3 MB, alt required
SHARE_KEY = "site.share"  # shown at 40:21, max 1 MB, alt not required
TILE_KEY = "networks.static"  # shown at 3:4, max 1.5 MB, alt not required


@pytest.fixture(autouse=True)
def local_media(settings, tmp_path):
    """
    Every test in this module stores uploads in a throwaway folder.
    backend/.env can hold live R2 credentials and pytest reads it, so this is
    what keeps a test run from writing to the real bucket.
    """
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    }
    settings.MEDIA_ROOT = tmp_path

    storage = storages["default"]
    assert type(storage) is FileSystemStorage
    assert Path(storage.location) == tmp_path
    return tmp_path


def sync():
    out = StringIO()
    call_command("sync_site_images", stdout=out)
    return out.getvalue()


@pytest.fixture
def slots(db):
    sync()
    return {slot.key: slot for slot in SiteImage.objects.all()}


@pytest.fixture
def admin_superuser(db):
    return User.objects.create_superuser(username="site_super_test", password="x", role="admin")


def as_staff(user):
    """The conftest role users can't sign in to the admin until they're staff."""
    user.is_staff = True
    user.save(update_fields=["is_staff"])
    return user


def image_bytes(width, height, fmt="JPEG", noisy=False):
    """A real image file. `noisy` fills it with random pixels so it can't compress."""
    if noisy:
        image = Image.frombytes("RGB", (width, height), os.urandom(width * height * 3))
    else:
        image = Image.new("RGB", (width, height), (40, 90, 160))
    buffer = io.BytesIO()
    image.save(buffer, fmt)
    return buffer.getvalue()


def make_upload(width, height, fmt="JPEG", noisy=False):
    extension = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif", "BMP": "bmp"}[fmt]
    return SimpleUploadedFile(
        f"photo.{extension}", image_bytes(width, height, fmt, noisy), content_type=f"image/{fmt.lower()}",
    )


def post_change(client, slot, upload=None, alt_text="A billboard on Morogoro Road"):
    data = {"alt_text": alt_text, "_save": "Save"}
    if upload is not None:
        data["image"] = upload
    return client.post(reverse("admin:sitecontent_siteimage_change", args=[slot.pk]), data)


def form_errors(response):
    assert response.status_code == 200, "expected the form to be shown again with errors"
    return response.context["adminform"].form.errors


@pytest.mark.django_db
class TestSync:
    def test_creates_one_row_per_registry_entry(self):
        output = sync()

        assert len(registry.REGISTRY) == 11
        assert SiteImage.objects.count() == 11
        assert "11 created, 0 updated, 0 deactivated" in output
        assert list(SiteImage.objects.values_list("key", flat=True)) == [e["key"] for e in registry.REGISTRY]

    def test_new_rows_start_with_the_default_alt(self, slots):
        assert slots["home.hero.ooh"].alt_text == "Ashton Media out-of-home billboard"
        assert slots["networks.static"].alt_text == ""

    def test_second_run_changes_nothing(self):
        sync()
        before = list(SiteImage.objects.order_by("pk").values())

        output = sync()

        assert "0 created, 0 updated, 0 deactivated" in output
        assert list(SiteImage.objects.order_by("pk").values()) == before

    def test_registry_change_keeps_image_alt_and_editor(self, slots, admin_user, monkeypatch):
        slot = slots[HERO_KEY]
        slot.image = make_upload(2560, 1440)
        slot.alt_text = "Gantry billboard on Morogoro Road"
        slot.updated_by = admin_user
        slot.save()
        slot.refresh_from_db()
        stored_name, stored_at = slot.image.name, slot.updated_at

        changed = copy.deepcopy(registry.REGISTRY)
        entry = next(e for e in changed if e["key"] == HERO_KEY)
        entry["title"] = "Home → Hero slideshow → First slide"
        monkeypatch.setattr(registry, "REGISTRY", changed)

        output = sync()
        slot.refresh_from_db()

        assert "0 created, 1 updated, 0 deactivated" in output
        assert slot.title == "Home → Hero slideshow → First slide"
        assert slot.image.name == stored_name
        assert slot.alt_text == "Gantry billboard on Morogoro Road"
        assert slot.updated_by == admin_user
        assert slot.updated_at == stored_at

    def test_removed_key_is_deactivated_not_deleted(self, slots, monkeypatch):
        monkeypatch.setattr(registry, "REGISTRY", [e for e in registry.REGISTRY if e["key"] != "site.share"])

        output = sync()

        assert "0 created, 0 updated, 1 deactivated" in output
        assert SiteImage.objects.count() == 11
        assert SiteImage.objects.get(key="site.share").active is False
        assert SiteImage.objects.filter(active=True).count() == 10


@pytest.mark.django_db
class TestPublicApi:
    def test_anonymous_gets_an_empty_object_when_nothing_is_set(self, slots):
        response = APIClient().get("/api/site-content/")

        assert response.status_code == 200
        assert response.json() == {}

    def test_only_active_slots_with_an_image_are_returned(self, slots):
        shown = slots[HERO_KEY]
        shown.image = make_upload(2560, 1440)
        shown.alt_text = "Gantry billboard on Morogoro Road"
        shown.save()

        retired = slots["site.share"]
        retired.image = make_upload(1200, 630)
        retired.active = False
        retired.save()

        body = APIClient().get("/api/site-content/").json()

        assert list(body) == [HERO_KEY]
        assert body[HERO_KEY] == {
            "url": f"http://testserver{shown.image.url}",
            "alt": "Gantry billboard on Morogoro Road",
            "width": 2560,
            "height": 1440,
        }

    def test_is_read_only(self, slots):
        assert APIClient().post("/api/site-content/", {}, format="json").status_code == 405


@pytest.mark.django_db
class TestAdminAccess:
    def test_admin_role_sees_the_changelist(self, client, admin_user, slots):
        client.force_login(as_staff(admin_user))
        response = client.get(reverse(CHANGELIST))
        html = response.content.decode()

        assert response.status_code == 200
        assert "Home → Hero slideshow → Slide 1 (Out-of-Home Advertising)" in html
        assert "Shown at 16:9, cropped to fit · max 3 MB" in html
        assert "Shown at 21:9, cropped to fit · max 3 MB" in html
        assert "Shown at 40:21, cropped to fit · max 1 MB" in html
        assert "Using default image" in html
        assert not mentions_size_or_shape_rule(html)

    def test_changelist_has_a_photo_size_column(self, client, admin_user, slots):
        slot = slots[HERO_KEY]
        slot.image = make_upload(1600, 900)
        slot.save()
        client.force_login(as_staff(admin_user))

        html = client.get(reverse(CHANGELIST)).content.decode()

        assert "Photo size" in html
        assert html.count("1600 × 900") == 1
        # The ten slots without a photo show a dash in that column.
        assert len(re.findall(r'class="field-photo_size[^"]*"[^>]*>\s*—', html)) == 10

    def test_design_role_sees_the_changelist(self, client, design_user, slots):
        client.force_login(as_staff(design_user))
        assert client.get(reverse(CHANGELIST)).status_code == 200

    def test_sales_role_cannot_open_the_changelist(self, client, sales_user, slots):
        client.force_login(as_staff(sales_user))
        assert client.get(reverse(CHANGELIST)).status_code == 403

    def test_operations_role_cannot_open_the_changelist(self, client, operations_user, slots):
        client.force_login(as_staff(operations_user))
        assert client.get(reverse(CHANGELIST)).status_code == 403

    def test_retired_slots_are_not_listed(self, client, admin_superuser, slots):
        SiteImage.objects.filter(key="site.share").update(active=False)
        client.force_login(admin_superuser)

        html = client.get(reverse(CHANGELIST)).content.decode()

        assert "Site-wide → Social share image" not in html

    @pytest.mark.parametrize("who", ["superuser", "admin", "design"])
    def test_nobody_can_add_or_delete(self, client, slots, who, admin_superuser, admin_user, design_user):
        user = {"superuser": admin_superuser, "admin": as_staff(admin_user), "design": as_staff(design_user)}[who]
        client.force_login(user)
        slot = slots[HERO_KEY]

        assert client.get(reverse("admin:sitecontent_siteimage_add")).status_code == 403
        assert client.post(reverse("admin:sitecontent_siteimage_add"), {"alt_text": "x"}).status_code == 403
        delete_url = reverse("admin:sitecontent_siteimage_delete", args=[slot.pk])
        assert client.get(delete_url).status_code == 403
        assert client.post(delete_url, {"post": "yes"}).status_code == 403
        client.post(reverse(CHANGELIST), {"action": "delete_selected", "_selected_action": slot.pk})

        assert SiteImage.objects.count() == 11

        request = RequestFactory().get("/")
        request.user = user
        model_admin = admin.site._registry[SiteImage]
        assert model_admin.has_add_permission(request) is False
        assert model_admin.has_delete_permission(request, slot) is False
        assert "delete_selected" not in model_admin.get_actions(request)

    def test_change_form_shows_the_slot_and_only_two_inputs(self, client, design_user, slots):
        client.force_login(as_staff(design_user))
        slot = slots["traditional.banner"]

        response = client.get(reverse("admin:sitecontent_siteimage_change", args=[slot.pk]))
        html = response.content.decode()

        assert response.status_code == 200
        assert list(response.context["adminform"].form.fields) == ["image", "alt_text"]
        assert "Shown at 21:9, cropped to fit · max 3 MB. JPEG, PNG or WebP." in html
        assert not mentions_size_or_shape_rule(html)
        assert PHOTO_HELP in html
        assert "traditional.banner" in html
        assert "Use a photo that matches the caption." in html

    def test_spec_line_wording(self, slots):
        assert slots[HERO_KEY].spec_line == "Shown at 16:9, cropped to fit · max 3 MB"
        assert slots[BANNER_KEY].spec_line == "Shown at 21:9, cropped to fit · max 3 MB"
        assert slots[TILE_KEY].spec_line == "Shown at 3:4, cropped to fit · max 1.5 MB"
        assert slots[SHARE_KEY].spec_line == "Shown at 40:21, cropped to fit · max 1 MB"
        # No pixel minimum anywhere, for any of the eleven slots.
        assert not any(re.search(r"\d\s*(px|×)", slot.spec_line) for slot in slots.values())


@pytest.mark.django_db
class TestCropPreview:
    @pytest.fixture(autouse=True)
    def login(self, client, design_user):
        client.force_login(as_staff(design_user))

    def change_form(self, client, slot):
        response = client.get(reverse("admin:sitecontent_siteimage_change", args=[slot.pk]))
        assert response.status_code == 200
        return response.content.decode()

    def with_image(self, slot, width, height):
        slot.image = make_upload(width, height)
        slot.save()
        return slot

    def test_nothing_is_drawn_without_an_image(self, client, slots):
        html = self.change_form(client, slots[HERO_KEY])

        assert "photo-preview" not in html
        assert "Your photo" not in html
        assert "Current photo" not in html
        assert "How it appears on the site" not in html
        assert "On a phone" not in html
        # The note about cropping is help text on the field, so it is there from the start.
        assert PHOTO_HELP in html

    def test_hero_slot_gets_the_site_box_and_the_phone_box(self, client, slots):
        slot = self.with_image(slots[HERO_KEY], 2560, 1440)

        html = self.change_form(client, slot)

        assert "Your photo" in html
        assert "Current photo: 2560 × 1440 px" in html
        assert "How it appears on the site" in html
        assert 'class="photo-preview__frame" style="aspect-ratio: 16 / 9;"' in html
        assert "On a phone" in html
        assert 'class="photo-preview__frame" style="aspect-ratio: 9 / 19.5;"' in html
        assert html.count(slot.image.url) >= 3

    @pytest.mark.parametrize("key, shape", [
        (BANNER_KEY, "7 / 3"), (TILE_KEY, "3 / 4"), (SHARE_KEY, "40 / 21"),
    ])
    def test_other_slots_get_the_site_box_only(self, client, slots, key, shape):
        slot = self.with_image(slots[key], 2400, 1600)

        html = self.change_form(client, slot)

        assert "How it appears on the site" in html
        assert f'class="photo-preview__frame" style="aspect-ratio: {shape};"' in html
        assert "On a phone" not in html

    def test_an_upload_that_failed_validation_is_not_previewed(self, client, slots):
        slot = self.with_image(slots[HERO_KEY], 2560, 1440)
        stored_url = slot.image.url

        # A good photo, but the required alt text is missing: the save is refused.
        response = post_change(client, slot, make_upload(3000, 2000), alt_text="")
        html = response.content.decode()

        assert response.status_code == 200
        assert "photo-preview__frame" not in html
        slot.refresh_from_db()
        assert slot.image.url == stored_url


@pytest.mark.django_db
class TestUploadValidation:
    @pytest.fixture(autouse=True)
    def login(self, client, design_user):
        self.user = as_staff(design_user)
        client.force_login(self.user)

    def test_correct_image_is_accepted(self, client, slots, local_media):
        slot = slots[HERO_KEY]

        response = post_change(client, slot, make_upload(2560, 1440))
        slot.refresh_from_db()

        assert response.status_code == 302
        assert slot.image.name.startswith(f"site-images/{HERO_KEY}/")
        assert (slot.image_width, slot.image_height) == (2560, 1440)
        assert slot.updated_by == self.user
        assert (local_media / slot.image.name).is_file()

        html = client.get(reverse(CHANGELIST)).content.decode()
        assert "Custom image" in html

    def test_png_and_webp_are_accepted(self, client, slots):
        assert post_change(client, slots[HERO_KEY], make_upload(2560, 1440, "PNG")).status_code == 302
        assert post_change(client, slots["home.hero.digital"], make_upload(2560, 1440, "WEBP")).status_code == 302

    # Shape and pixel size are the editor's call: the site crops to fit, and the
    # stored min_width and min_height are no longer read. Every one of these is
    # far from the slot's shape or far below its old minimum.
    @pytest.mark.parametrize("key", [HERO_KEY, BANNER_KEY, TILE_KEY, SHARE_KEY], ids=["hero", "banner", "tile", "share"])
    @pytest.mark.parametrize("width, height", [(2400, 600), (800, 2400), (1000, 1000), (200, 150)], ids=["wide", "tall", "square", "tiny"])
    def test_any_size_and_shape_is_accepted(self, client, slots, key, width, height):
        slot = slots[key]

        response = post_change(client, slot, make_upload(width, height))
        slot.refresh_from_db()

        assert response.status_code == 302, response.context and response.context["adminform"].form.errors
        assert (slot.image_width, slot.image_height) == (width, height)

    def test_every_problem_is_reported_together(self, client, slots):
        # Wrong format, too heavy and no alt text, all in one go. It is also small
        # and the wrong shape for a hero, which nobody complains about.
        upload = make_upload(1000, 1100, "BMP")
        assert upload.size > 3 * 1024 * 1024

        errors = form_errors(post_change(client, slots[HERO_KEY], upload, alt_text=""))

        assert len(errors["image"]) == 2
        assert errors["image"][0] == "Upload a JPEG, PNG or WebP file. Yours is a BMP file."
        assert errors["image"][1].startswith("This slot allows files up to 3 MB. Your file is ")
        assert len(errors["alt_text"]) == 1
        assert not any("16:9" in message or mentions_size_or_shape_rule(message) for message in errors["image"])

    def test_over_the_size_limit_is_rejected(self, client, slots):
        upload = make_upload(1200, 630, "PNG", noisy=True)
        assert upload.size > 1024 * 1024

        errors = form_errors(post_change(client, slots[SHARE_KEY], upload))

        assert len(errors["image"]) == 1
        assert errors["image"][0].startswith("This slot allows files up to 1 MB. Your file is ")

    def test_other_formats_are_rejected(self, client, slots):
        errors = form_errors(post_change(client, slots[HERO_KEY], make_upload(2560, 1440, "GIF")))

        assert errors["image"] == ["Upload a JPEG, PNG or WebP file. Yours is a GIF file."]

    def test_missing_alt_is_rejected_where_required(self, client, slots):
        slot = slots[HERO_KEY]

        errors = form_errors(post_change(client, slot, make_upload(2560, 1440), alt_text=""))
        slot.refresh_from_db()

        assert "alt_text" in errors
        assert not slot.image

    def test_missing_alt_is_fine_where_not_required(self, client, slots):
        slot = slots[TILE_KEY]

        response = post_change(client, slot, make_upload(1200, 1600), alt_text="")
        slot.refresh_from_db()

        assert response.status_code == 302
        assert slot.image

    def test_editing_alt_does_not_recheck_the_stored_image(self, client, slots, monkeypatch):
        slot = slots[HERO_KEY]
        assert post_change(client, slot, make_upload(2560, 1440)).status_code == 302
        slot.refresh_from_db()
        stored_name = slot.image.name
        # Two ways a re-check would show: the slot's cap is now below the stored
        # file's size, and the checker itself refuses to be called.
        SiteImage.objects.filter(pk=slot.pk).update(max_mb=Decimal("0.0"))

        def never(*args, **kwargs):
            raise AssertionError("a stored image was inspected again")

        monkeypatch.setattr(site_image_forms, "upload_problems", never)

        response = post_change(client, slot, alt_text="New description")
        slot.refresh_from_db()

        assert response.status_code == 302
        assert slot.alt_text == "New description"
        assert slot.image.name == stored_name

    def test_clearing_goes_back_to_the_default_and_keeps_the_file(self, client, slots, local_media):
        slot = slots[HERO_KEY]
        post_change(client, slot, make_upload(2560, 1440))
        slot.refresh_from_db()
        stored_name = slot.image.name

        url = reverse("admin:sitecontent_siteimage_change", args=[slot.pk])
        response = client.post(url, {"alt_text": "", "image-clear": "on", "_save": "Save"})
        slot.refresh_from_db()

        assert response.status_code == 302
        assert not slot.image
        assert (slot.image_width, slot.image_height) == (None, None)
        assert (local_media / stored_name).is_file()


@pytest.mark.django_db
class TestSidebarVisibility:
    @pytest.mark.parametrize("role, expected", [
        ("admin", True), ("design", True), ("sales", False), ("operations", False),
    ])
    def test_by_role(self, role, expected):
        user = User.objects.create_user(username=f"nav_{role}", password="x", role=role)
        assert can_view_site_images(SimpleNamespace(user=user)) is expected

    def test_superuser_sees_it_whatever_the_role(self):
        user = User.objects.create_superuser(username="nav_super", password="x", role="sales")
        assert can_view_site_images(SimpleNamespace(user=user)) is True


MAPPED_KEYS = list(seed.SLOT_PHOTOS)
UNMAPPED_KEYS = ["networks.static", "networks.digital", "networks.airport", "networks.station", "site.share"]


@pytest.mark.django_db
class TestSeed:
    @pytest.fixture(autouse=True)
    def no_network(self, monkeypatch):
        """Nothing here may reach the internet, mocked or not."""
        def refuse(*args, **kwargs):
            raise AssertionError("a test tried to open a network connection")

        monkeypatch.setattr(urllib.request, "urlopen", refuse)

    @pytest.fixture
    def downloads(self, monkeypatch):
        """Stands in for the network: hands back a photo that fits a hero slot."""
        calls = []

        def fake_download(url):
            calls.append(url)
            return image_bytes(2560, 1440)

        monkeypatch.setattr(seed, "download", fake_download)
        return calls

    def run(self, *args):
        out = StringIO()
        call_command("seed_site_images", *args, stdout=out)
        return out.getvalue()

    def stored_files(self, media):
        return sorted(str(path.relative_to(media)) for path in media.rglob("*") if path.is_file())

    def test_fills_the_six_mapped_slots_and_leaves_the_rest_empty(self, slots, downloads, local_media):
        output = self.run("--yes")

        filled = {slot.key: slot for slot in SiteImage.objects.exclude(image="").exclude(image__isnull=True)}
        assert sorted(filled) == sorted(MAPPED_KEYS)
        for key, slot in filled.items():
            # Its own copy, under its own folder, with the size recorded.
            assert slot.image.name == f"site-images/{key}/{seed.SLOT_PHOTOS[key]}"
            assert (local_media / slot.image.name).is_file()
            assert (slot.image_width, slot.image_height) == (2560, 1440)
            assert slot.updated_by is None
        assert all(not slot.image for slot in SiteImage.objects.filter(key__in=UNMAPPED_KEYS))
        assert SiteImage.objects.filter(key__in=UNMAPPED_KEYS).count() == 5

        # Three source files serve six slots: each is fetched once.
        assert sorted(downloads) == sorted(seed.LEGACY_PHOTO_BASE + name for name in set(seed.SLOT_PHOTOS.values()))
        assert "6 filled (0 replacing an existing image), 0 skipped, 0 failed" in output
        assert "Database:" in output and "FileSystemStorage" in output

    def test_filling_does_not_touch_updated_at(self, slots, downloads):
        before = slots[HERO_KEY].updated_at

        self.run("--yes")

        assert SiteImage.objects.get(key=HERO_KEY).updated_at == before

    def test_skips_a_slot_that_already_has_an_image(self, slots, downloads, admin_user):
        slot = slots[HERO_KEY]
        slot.image = make_upload(3000, 1688)
        slot.updated_by = admin_user
        slot.save()
        slot.refresh_from_db()
        editors_file = slot.image.name

        output = self.run("--yes")
        slot.refresh_from_db()

        assert slot.image.name == editors_file
        assert (slot.image_width, slot.image_height) == (3000, 1688)
        assert slot.updated_by == admin_user
        assert "5 filled (0 replacing an existing image), 1 skipped, 0 failed" in output
        assert "already has an image, left alone" in output

    def test_force_replaces_and_says_so(self, slots, downloads, admin_user, local_media):
        slot = slots[HERO_KEY]
        slot.image = make_upload(3000, 1688)
        slot.updated_by = admin_user
        slot.save()
        slot.refresh_from_db()
        editors_file = slot.image.name

        output = self.run("--yes", "--force")
        slot.refresh_from_db()

        assert slot.image.name != editors_file
        assert (slot.image_width, slot.image_height) == (2560, 1440)
        assert slot.updated_by == admin_user
        assert f"REPLACED {HERO_KEY}: was {editors_file}, now {slot.image.name}" in output
        assert "6 filled (1 replacing an existing image), 0 skipped, 0 failed" in output
        assert (local_media / editors_file).is_file(), "the replaced file stays in storage"

    def test_one_failing_download_does_not_stop_the_others(self, slots, monkeypatch):
        calls = []

        def flaky_download(url):
            calls.append(url)
            if url.endswith("campaign-5-2x.png"):
                raise OSError("connection reset")
            return image_bytes(2560, 1440)

        monkeypatch.setattr(seed, "download", flaky_download)
        out = StringIO()

        with pytest.raises(CommandError):
            call_command("seed_site_images", "--yes", stdout=out)

        filled = set(SiteImage.objects.exclude(image="").exclude(image__isnull=True).values_list("key", flat=True))
        assert filled == {"home.hero.ooh", "home.hero.digital", "traditional.banner", "digital.banner"}
        assert "could not get campaign-5-2x.png (connection reset)" in out.getvalue()
        assert "4 filled (0 replacing an existing image), 0 skipped, 2 failed" in out.getvalue()
        # The failed file is not retried for the second slot that uses it.
        assert len(calls) == 3

    def test_unreadable_image_is_a_failure(self, slots, monkeypatch):
        monkeypatch.setattr(seed, "download", lambda url: b"<html>404 Not Found</html>")
        out = StringIO()

        with pytest.raises(CommandError):
            call_command("seed_site_images", "--yes", stdout=out)

        assert not SiteImage.objects.exclude(image="").exclude(image__isnull=True).exists()
        assert "is not an image we can read" in out.getvalue()

    def test_dry_run_writes_nothing_and_downloads_nothing(self, slots, downloads, local_media):
        taken = slots["digital.banner"]
        taken.image = make_upload(2400, 1029)
        taken.save()
        files_before = self.stored_files(local_media)

        output = self.run("--dry-run")

        assert downloads == []
        assert self.stored_files(local_media) == files_before
        assert SiteImage.objects.exclude(image="").exclude(image__isnull=True).count() == 1
        assert "5 would be filled (0 replacing an existing image), 1 skipped, 0 failed" in output
        plan = {line.split()[0]: line for line in output.splitlines() if line.split() and line.split()[0] in MAPPED_KEYS}
        assert "would skip" in plan["digital.banner"]
        assert "would fill" in plan["home.hero.ooh"] and "slp-1144-copy.jpg" in plan["home.hero.ooh"]
        assert "file size is compared with its slot's cap" in output
        assert not mentions_size_or_shape_rule(output)

    def test_alt_text_comes_from_the_default_only_when_blank_and_required(self, slots, downloads):
        SiteImage.objects.filter(key="home.hero.ooh").update(alt_text="")
        SiteImage.objects.filter(key="home.hero.digital").update(alt_text="An editor's own words")
        SiteImage.objects.filter(key="home.hero.airport").update(alt_text="", alt_required=False)

        self.run("--yes")

        alts = dict(SiteImage.objects.values_list("key", "alt_text"))
        assert alts["home.hero.ooh"] == "Ashton Media out-of-home billboard"
        assert alts["home.hero.digital"] == "An editor's own words"
        assert alts["home.hero.airport"] == ""

    def test_a_tiny_photo_is_ok_and_its_pixel_size_is_only_shown(self, slots, monkeypatch):
        # 200×150 is far below every slot's old minimum and the wrong shape for all of them.
        monkeypatch.setattr(seed, "download", lambda url: image_bytes(200, 150))

        output = self.run("--yes")

        slot = SiteImage.objects.get(key=HERO_KEY)
        assert (slot.image_width, slot.image_height) == (200, 150)
        assert "6 filled (0 replacing an existing image), 0 skipped, 0 failed" in output
        assert output.count("OK (") == 6
        # The size is still in the table, as information.
        assert output.count("200×150") == 6
        assert "21:9" not in output and not mentions_size_or_shape_rule(output)

    def test_a_file_over_the_cap_is_filled_with_a_warning(self, slots, monkeypatch):
        heavy = image_bytes(1100, 1000, "PNG", noisy=True)
        assert len(heavy) > 3 * 1024 * 1024
        monkeypatch.setattr(seed, "download", lambda url: heavy)

        output = self.run("--yes")

        assert "6 filled (0 replacing an existing image), 0 skipped, 0 failed" in output
        assert output.count("This slot allows files up to 3 MB. Your file is ") == 6
        assert not mentions_size_or_shape_rule(output)

    def test_anything_but_yes_at_the_prompt_aborts(self, slots, downloads, monkeypatch, local_media):
        monkeypatch.setattr("builtins.input", lambda prompt: "y")

        output = self.run()

        assert "Cancelled. Nothing was written." in output
        assert downloads == []
        assert self.stored_files(local_media) == []
        assert not SiteImage.objects.exclude(image="").exclude(image__isnull=True).exists()

    def test_typing_yes_at_the_prompt_proceeds(self, slots, downloads, monkeypatch):
        monkeypatch.setattr("builtins.input", lambda prompt: "yes")

        self.run()

        assert SiteImage.objects.exclude(image="").exclude(image__isnull=True).count() == 6

    def test_missing_rows_point_at_the_sync_command(self, db, downloads):
        out = StringIO()

        with pytest.raises(CommandError):
            call_command("seed_site_images", "--yes", stdout=out)

        assert out.getvalue().count("run `python manage.py sync_site_images` first") == 6
        assert downloads == []

    def test_source_dir_is_used_instead_of_the_network(self, slots, monkeypatch, tmp_path_factory):
        folder = tmp_path_factory.mktemp("legacy-photos")
        for name in set(seed.SLOT_PHOTOS.values()):
            (folder / name).write_bytes(image_bytes(2560, 1440))

        def never(url):
            raise AssertionError("downloaded despite --source-dir")

        monkeypatch.setattr(seed, "download", never)

        output = self.run("--yes", "--source-dir", str(folder))

        assert "6 filled (0 replacing an existing image), 0 skipped, 0 failed" in output

    def test_storage_description_names_the_bucket_when_there_is_one(self):
        class FakeS3Storage:
            bucket_name = "ashton-media"

        assert seed.describe_storage(FakeS3Storage()).endswith("FakeS3Storage (bucket: ashton-media)")
        assert seed.describe_storage(storages["default"]) == "django.core.files.storage.filesystem.FileSystemStorage"
