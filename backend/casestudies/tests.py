import io
import os
import urllib.request
from io import StringIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage, storages
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from casestudies import forms as case_study_forms
from casestudies.management.commands import seed_case_studies as seed
from casestudies.models import CaseStudy, CaseStudyMetric
from core.nav_permissions import can_view_case_studies

User = get_user_model()

CHANGELIST = "admin:casestudies_casestudy_changelist"
ADD = "admin:casestudies_casestudy_add"


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


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Nothing in this module may reach the internet, mocked or not."""
    def refuse(*args, **kwargs):
        raise AssertionError("a test tried to open a network connection")

    monkeypatch.setattr(urllib.request, "urlopen", refuse)


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
    extension = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp", "GIF": "gif"}[fmt]
    return SimpleUploadedFile(
        f"photo.{extension}", image_bytes(width, height, fmt, noisy), content_type=f"image/{fmt.lower()}",
    )


def metric_rows(*metrics):
    """Inline formset fields for brand-new metrics, given as (value, label) pairs."""
    data = {
        "metrics-TOTAL_FORMS": str(len(metrics)),
        "metrics-INITIAL_FORMS": "0",
        "metrics-MIN_NUM_FORMS": "0",
        "metrics-MAX_NUM_FORMS": "3",
    }
    for index, (value, label) in enumerate(metrics):
        data[f"metrics-{index}-value"] = value
        data[f"metrics-{index}-label"] = label
        data[f"metrics-{index}-order"] = str(index + 1)
    return data


def form_data(*metrics, published=False, **fields):
    data = {
        "brand": "Vodacom Tanzania",
        "format_label": "Digital OOH",
        "headline": "15M+ Impressions in 30 Days",
        "description": "A four-screen campaign across the CBD.",
        "alt_text": "",
        "_save": "Save",
        **metric_rows(*metrics),
        **fields,
    }
    if published:
        data["published"] = "on"
    return {key: value for key, value in data.items() if value is not None}


def form_errors(response):
    assert response.status_code == 200, "expected the form to be shown again with errors"
    return response.context["adminform"].form.errors


def make_study(brand="Vodacom Tanzania", published=True, order=0, with_image=True, **fields):
    study = CaseStudy(
        brand=brand, format_label="Digital OOH", headline=f"{brand} headline", description="Body",
        alt_text=brand, published=published, order=order, **fields,
    )
    if with_image:
        study.image = make_upload(1200, 900)
    study.save()
    return study


@pytest.mark.django_db
class TestAdminAccess:
    @pytest.mark.parametrize("role", ["admin", "design"])
    def test_editors_can_add_edit_and_delete(self, client, role, admin_user, design_user, local_media):
        user = as_staff({"admin": admin_user, "design": design_user}[role])
        client.force_login(user)

        # Add, with a photo and two metrics, straight to published.
        response = client.post(reverse(ADD), form_data(
            ("15M+", "impressions"), ("38%", "recall lift"),
            image=make_upload(1200, 900), alt_text="Vodacom screen in the CBD", published=True,
        ))
        assert response.status_code == 302
        study = CaseStudy.objects.get()
        assert study.published is True
        assert study.updated_by == user
        assert study.image.name.startswith("case-studies/")
        assert (study.image_width, study.image_height) == (1200, 900)
        assert [(m.value, m.label) for m in study.metrics.all()] == [("15M+", "impressions"), ("38%", "recall lift")]

        # Edit the copy.
        change_url = reverse("admin:casestudies_casestudy_change", args=[study.pk])
        assert client.get(change_url).status_code == 200
        response = client.post(change_url, form_data(
            headline="A better headline", alt_text="Vodacom screen in the CBD", published=True,
        ))
        assert response.status_code == 302
        study.refresh_from_db()
        assert study.headline == "A better headline"
        assert study.image, "saving without a new file keeps the stored photo"

        # Delete. The row and its metrics go; the file stays in storage.
        stored_name = study.image.name
        delete_url = reverse("admin:casestudies_casestudy_delete", args=[study.pk])
        assert client.get(delete_url).status_code == 200
        assert client.post(delete_url, {"post": "yes"}).status_code == 302
        assert CaseStudy.objects.count() == 0
        assert CaseStudyMetric.objects.count() == 0
        assert (local_media / stored_name).is_file()

    def test_changelist_shows_each_case_study(self, client, design_user):
        make_study("Vodacom Tanzania", published=True)
        make_study("CRDB Bank", published=False, with_image=False)
        client.force_login(as_staff(design_user))

        response = client.get(reverse(CHANGELIST))
        html = response.content.decode()

        assert response.status_code == 200
        assert "Vodacom Tanzania" in html and "CRDB Bank" in html
        assert "Published" in html and "Draft" in html
        assert 'data-ordering-field="order"' in html

    def test_sales_role_cannot_open_the_changelist(self, client, sales_user):
        client.force_login(as_staff(sales_user))
        assert client.get(reverse(CHANGELIST)).status_code == 403
        assert client.get(reverse(ADD)).status_code == 403

    def test_operations_role_cannot_open_the_changelist(self, client, operations_user):
        client.force_login(as_staff(operations_user))
        assert client.get(reverse(CHANGELIST)).status_code == 403
        assert client.get(reverse(ADD)).status_code == 403

    def test_order_can_be_saved_from_the_list(self, client, design_user):
        first = make_study("Vodacom Tanzania", order=0)
        second = make_study("CRDB Bank", order=1)
        client.force_login(as_staff(design_user))

        # What dragging the second row above the first, then Save, submits.
        response = client.post(reverse(CHANGELIST), {
            "form-TOTAL_FORMS": "2", "form-INITIAL_FORMS": "2",
            "form-MIN_NUM_FORMS": "0", "form-MAX_NUM_FORMS": "1000",
            "form-0-id": str(first.pk), "form-0-order": "1",
            "form-1-id": str(second.pk), "form-1-order": "0",
            "_save": "Save",
        })

        assert response.status_code == 302
        assert list(CaseStudy.objects.values_list("brand", flat=True)) == ["CRDB Bank", "Vodacom Tanzania"]

    def test_add_form_explains_the_photo(self, client, design_user):
        client.force_login(as_staff(design_user))

        html = client.get(reverse(ADD)).content.decode()

        assert "4:3 · at least 1200×900 · max 1 MB" in html
        assert "bottom-left corner" in html
        assert "Up to 500 characters." in html


@pytest.mark.django_db
class TestValidation:
    @pytest.fixture(autouse=True)
    def login(self, client, design_user):
        client.force_login(as_staff(design_user))

    def add(self, client, **fields):
        return client.post(reverse(ADD), form_data(**fields))

    def test_correct_image_is_accepted(self, client):
        response = self.add(client, image=make_upload(1200, 900), alt_text="A screen", published=True)

        assert response.status_code == 302
        assert CaseStudy.objects.get().image

    def test_png_and_webp_are_accepted(self, client):
        assert self.add(client, image=make_upload(1200, 900, "PNG")).status_code == 302
        assert self.add(client, image=make_upload(1200, 900, "WEBP")).status_code == 302

    def test_wrong_ratio_is_rejected(self, client):
        errors = form_errors(self.add(client, image=make_upload(1600, 900)))

        assert errors["image"] == ["A case study photo needs 4:3. Your image is 16:9."]
        assert CaseStudy.objects.count() == 0

    def test_too_small_is_rejected(self, client):
        errors = form_errors(self.add(client, image=make_upload(800, 600)))

        assert errors["image"] == [
            "A case study photo needs an image at least 1200×900 pixels. Yours is 800×600.",
        ]

    def test_over_one_mb_is_rejected(self, client):
        upload = make_upload(1200, 900, "PNG", noisy=True)
        assert upload.size > 1024 * 1024

        errors = form_errors(self.add(client, image=upload))

        assert len(errors["image"]) == 1
        assert errors["image"][0].startswith("A case study photo allows files up to 1 MB. Your file is ")

    def test_every_problem_is_reported_together(self, client):
        errors = form_errors(self.add(client, image=make_upload(800, 450, "GIF")))

        assert errors["image"] == [
            "Upload a JPEG, PNG or WebP file. Yours is a GIF file.",
            "A case study photo needs an image at least 1200×900 pixels. Yours is 800×450.",
            "A case study photo needs 4:3. Your image is 16:9.",
        ]

    def test_draft_saves_without_image_or_alt(self, client):
        response = self.add(client)

        assert response.status_code == 302
        study = CaseStudy.objects.get()
        assert study.published is False
        assert not study.image

    def test_publishing_without_an_image_is_rejected(self, client):
        errors = form_errors(self.add(client, alt_text="A screen", published=True))

        assert len(errors["image"]) == 1
        assert errors["image"][0].startswith("A published case study needs a photo.")
        assert "alt_text" not in errors
        assert CaseStudy.objects.count() == 0

    def test_publishing_without_alt_text_is_rejected(self, client):
        errors = form_errors(self.add(client, image=make_upload(1200, 900), alt_text="  ", published=True))

        assert len(errors["alt_text"]) == 1
        assert errors["alt_text"][0].startswith("A published case study needs alt text.")
        assert "image" not in errors
        assert CaseStudy.objects.count() == 0

    def test_rejected_upload_is_not_also_reported_as_missing(self, client):
        errors = form_errors(self.add(client, image=make_upload(1600, 900), alt_text="A screen", published=True))

        assert errors["image"] == ["A case study photo needs 4:3. Your image is 16:9."]

    def test_description_over_500_characters_is_rejected(self, client):
        errors = form_errors(self.add(client, description="x" * 501))

        assert "description" in errors
        assert self.add(client, description="x" * 500).status_code == 302

    def test_editing_copy_does_not_recheck_the_stored_photo(self, client, monkeypatch):
        study = make_study()

        def never(*args, **kwargs):
            raise AssertionError("a stored photo was inspected again")

        monkeypatch.setattr(case_study_forms, "upload_problems", never)
        response = client.post(
            reverse("admin:casestudies_casestudy_change", args=[study.pk]),
            form_data(headline="New headline", alt_text="A screen", published=True),
        )
        study.refresh_from_db()

        assert response.status_code == 302
        assert study.headline == "New headline"


@pytest.mark.django_db
class TestMetrics:
    @pytest.fixture(autouse=True)
    def login(self, client, design_user):
        client.force_login(as_staff(design_user))

    def test_three_metrics_are_saved_in_order(self, client):
        response = client.post(reverse(ADD), form_data(
            ("15M+", "impressions"), ("38%", "recall lift"), ("4", "screens"),
        ))

        assert response.status_code == 302
        assert list(CaseStudy.objects.get().metrics.values_list("value", flat=True)) == ["15M+", "38%", "4"]

    def test_a_fourth_metric_is_rejected(self, client):
        response = client.post(reverse(ADD), form_data(
            ("15M+", "impressions"), ("38%", "recall lift"), ("4", "screens"), ("30", "days"),
        ))

        assert response.status_code == 200
        formset = response.context["inline_admin_formsets"][0].formset
        assert formset.non_form_errors() == ["Please submit at most 3 forms."]
        assert CaseStudy.objects.count() == 0
        assert CaseStudyMetric.objects.count() == 0

    def test_add_form_offers_one_blank_row(self, client):
        formset = client.get(reverse(ADD)).context["inline_admin_formsets"][0].formset

        assert formset.max_num == 3
        assert formset.total_form_count() == 1


@pytest.mark.django_db
class TestPublicApi:
    def test_anonymous_gets_an_empty_list(self):
        response = APIClient().get("/api/case-studies/")

        assert response.status_code == 200
        assert response.json() == []

    def test_only_published_case_studies_with_a_photo_are_returned(self):
        shown = make_study("Vodacom Tanzania")
        make_study("Draft Brand", published=False)
        make_study("No Photo Brand", published=True, with_image=False)
        CaseStudyMetric.objects.create(case_study=shown, value="38%", label="recall lift", order=2)
        CaseStudyMetric.objects.create(case_study=shown, value="15M+", label="impressions", order=1)

        body = APIClient().get("/api/case-studies/").json()

        assert body == [{
            "id": shown.id,
            "brand": "Vodacom Tanzania",
            "format_label": "Digital OOH",
            "headline": "Vodacom Tanzania headline",
            "description": "Body",
            "image": {
                "url": f"http://testserver{shown.image.url}",
                "alt": "Vodacom Tanzania",
                "width": 1200,
                "height": 900,
            },
            "metrics": [
                {"value": "15M+", "label": "impressions"},
                {"value": "38%", "label": "recall lift"},
            ],
        }]

    def test_order_then_id_decides_the_sequence(self):
        make_study("Third", order=2)
        make_study("First", order=1)
        make_study("Second", order=1)

        body = APIClient().get("/api/case-studies/").json()

        assert [study["brand"] for study in body] == ["First", "Second", "Third"]

    def test_two_queries_however_many_case_studies(self, django_assert_num_queries):
        for index in range(4):
            study = make_study(f"Brand {index}", order=index)
            CaseStudyMetric.objects.create(case_study=study, value="1", label="one")
            CaseStudyMetric.objects.create(case_study=study, value="2", label="two")

        with django_assert_num_queries(2):
            response = APIClient().get("/api/case-studies/")

        assert len(response.json()) == 4

    def test_is_read_only(self):
        assert APIClient().post("/api/case-studies/", {}, format="json").status_code == 405


@pytest.mark.django_db
class TestSeed:
    @pytest.fixture
    def downloads(self, monkeypatch):
        """Stands in for the network: hands back a photo that meets the spec."""
        calls = []

        def fake_download(url):
            calls.append(url)
            return image_bytes(1200, 900)

        monkeypatch.setattr(seed, "download", fake_download)
        return calls

    def run(self, *args):
        out = StringIO()
        call_command("seed_case_studies", *args, stdout=out)
        return out.getvalue()

    def test_creates_four_published_case_studies_with_metrics(self, downloads, local_media):
        output = self.run("--yes")

        studies = list(CaseStudy.objects.all())
        assert [s.brand for s in studies] == ["Vodacom Tanzania", "CRDB Bank", "Azam FC", "Airtel Tanzania"]
        assert [s.order for s in studies] == [1, 2, 3, 4]
        assert all(s.published for s in studies)
        assert [s.alt_text for s in studies] == [s.brand for s in studies]
        assert [s.format_label for s in studies] == ["Digital", "Static", "Airport", "Digital"]
        assert all((local_media / s.image.name).is_file() for s in studies)
        assert [(m.value, m.label) for m in studies[1].metrics.all()] == [("2.4M", "reach"), ("8 wks", "duration")]
        assert CaseStudyMetric.objects.count() == 8

        assert downloads == [seed.LEGACY_PHOTO_BASE + name for name in [
            "campaign-2-2x.png", "slp-1144-copy.jpg", "campaign-5-2x.png", "campaign-3-2x.png",
        ]]
        assert "4 created, 0 skipped, 0 failed" in output
        assert output.count("spec:  OK") == 4
        assert "FileSystemStorage" in output and "Database:" in output

    def test_second_run_creates_none(self, downloads):
        self.run("--yes")
        downloads.clear()

        output = self.run("--yes")

        assert "0 created, 4 skipped, 0 failed" in output
        assert CaseStudy.objects.count() == 4
        assert downloads == []

    def test_existing_brand_is_never_overwritten(self, downloads):
        mine = make_study("CRDB Bank", published=False, with_image=False, order=9)

        output = self.run("--yes")
        mine.refresh_from_db()

        assert "3 created, 1 skipped, 0 failed" in output
        assert CaseStudy.objects.filter(brand="CRDB Bank").count() == 1
        assert (mine.headline, mine.published, mine.order) == ("CRDB Bank headline", False, 9)

    def test_dry_run_writes_nothing_and_stays_offline(self, monkeypatch, local_media):
        def never(url):
            raise AssertionError("dry run tried to download")

        monkeypatch.setattr(seed, "download", never)

        output = self.run("--dry-run")

        assert "4 would be created, 0 skipped" in output
        assert "would download https://www.ashtonmedia.net/uploads/1/4/4/1/144182232/campaign-2-2x.png" in output
        assert CaseStudy.objects.count() == 0
        assert list(local_media.iterdir()) == []

    def test_one_failed_download_does_not_stop_the_rest(self, monkeypatch):
        def flaky_download(url):
            if url.endswith("slp-1144-copy.jpg"):
                raise OSError("connection reset")
            return image_bytes(1200, 900)

        monkeypatch.setattr(seed, "download", flaky_download)
        out = StringIO()

        with pytest.raises(CommandError):
            call_command("seed_case_studies", "--yes", stdout=out)

        assert sorted(CaseStudy.objects.values_list("brand", flat=True)) == [
            "Airtel Tanzania", "Azam FC", "Vodacom Tanzania",
        ]
        assert "FAILED: could not get slp-1144-copy.jpg (connection reset)" in out.getvalue()
        assert "3 created, 0 skipped, 1 failed" in out.getvalue()

    def test_off_spec_photo_is_a_warning_not_a_block(self, monkeypatch):
        monkeypatch.setattr(seed, "download", lambda url: image_bytes(1600, 900))

        output = self.run("--yes")

        assert CaseStudy.objects.count() == 4
        assert output.count("WARNING A case study photo needs 4:3. Your image is 16:9.") == 4

    def test_source_dir_is_used_instead_of_the_network(self, monkeypatch, tmp_path_factory):
        folder = tmp_path_factory.mktemp("legacy-photos")
        for entry in seed.CASE_STUDIES:
            (folder / entry["photo"]).write_bytes(image_bytes(1200, 900))

        def never(url):
            raise AssertionError("downloaded despite --source-dir")

        monkeypatch.setattr(seed, "download", never)

        output = self.run("--yes", "--source-dir", str(folder))

        assert "4 created, 0 skipped, 0 failed" in output

    def test_anything_but_yes_at_the_prompt_cancels(self, downloads, monkeypatch):
        monkeypatch.setattr("builtins.input", lambda prompt: "y")

        output = self.run()

        assert "Cancelled. Nothing was written." in output
        assert CaseStudy.objects.count() == 0
        assert downloads == []

    def test_typing_yes_at_the_prompt_proceeds(self, downloads, monkeypatch):
        monkeypatch.setattr("builtins.input", lambda prompt: "yes")

        self.run()

        assert CaseStudy.objects.count() == 4


@pytest.mark.django_db
class TestSidebarVisibility:
    @pytest.mark.parametrize("role, expected", [
        ("admin", True), ("design", True), ("sales", False), ("operations", False),
    ])
    def test_by_role(self, role, expected):
        user = User.objects.create_user(username=f"nav_{role}", password="x", role=role)
        assert can_view_case_studies(SimpleNamespace(user=user)) is expected

    def test_superuser_sees_it_whatever_the_role(self):
        user = User.objects.create_superuser(username="nav_super", password="x", role="sales")
        assert can_view_case_studies(SimpleNamespace(user=user)) is True
