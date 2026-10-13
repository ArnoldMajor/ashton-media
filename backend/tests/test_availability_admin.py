"""
The admin's Availability page (billboards/admin_availability.py), the shared
PDF function behind it (billboards/pdf.py), and the API endpoints that must
keep working as they did.

Nothing here renders a real PDF except the one smoke test at the bottom: the
renderer is patched where it is called.
"""
import re
from datetime import date
from types import SimpleNamespace
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage, storages
from django.db.backends.postgresql.psycopg_any import DateRange
from django.test import Client as WebClient
from django.utils.html import strip_tags
from rest_framework.test import APIClient

from billboards import admin_availability, pdf
from billboards.models import Billboard
from clients.models import Client
from contracts.models import Contract

try:
    import weasyprint  # noqa: F401
    WEASYPRINT_PROBLEM = None
except (OSError, ImportError) as error:  # its native libraries (Pango) are missing
    WEASYPRINT_PROBLEM = str(error)

User = get_user_model()

URL = "/admin/billboards/billboard/availability/"
CLIENT_NAME = "ZZ Leak Test Co"
START, END = "2026-10-05", "2026-10-10"
DATES = {"start": START, "end": END}
RENDERER = "billboards.admin_availability.render_availability_pdf"
FAKE_PDF = b"%PDF-1.7 fake"


@pytest.fixture(autouse=True)
def local_media(settings, tmp_path):
    """No test in this project may be able to reach R2."""
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    }
    settings.MEDIA_ROOT = tmp_path
    assert type(storages["default"]) is FileSystemStorage


@pytest.fixture
def superuser(db):
    # A superuser whose role is neither admin nor sales still gets the page.
    return User.objects.create_superuser(username="super_test", password="x", role="design")


@pytest.fixture
def users(admin_user, sales_user, operations_user, design_user, superuser):
    return {
        "admin": admin_user, "sales": sales_user, "operations": operations_user,
        "design": design_user, "superuser": superuser,
    }


def make_site(code, **fields):
    defaults = dict(
        name=f"Site {code}", format=Billboard.Format.STATIC, status=Billboard.Status.AVAILABLE,
        region="Dar es Salaam", address="Test Rd", latitude=-6.8, longitude=39.28,
    )
    return Billboard.objects.create(site_code=code, **{**defaults, **fields})


@pytest.fixture
def world(db):
    """
    Six sites, searched for 5 to 10 October 2026:
    free, cancelled and ended are available (3); booked is on sale but taken
    (1); maintenance and unavailable are not for sale (2).
    """
    client = Client.objects.create(company_name=CLIENT_NAME, contact_name="Jane", email="jane@zz.test")

    def contract(site, first, after_last, status):
        return Contract.objects.create(billboard=site, client=client, status=status, date_range=DateRange(first, after_last))

    sites = SimpleNamespace(
        free=make_site(
            "AV-001", name="Morogoro Road Unipole", address="Morogoro Rd, Ubungo", structure_code="STR-77",
            side="A", width_meters=6, height_meters=3,
        ),
        booked=make_site("AV-002", name="Clock Tower Screen", format=Billboard.Format.DIGITAL, region="Arusha"),
        cancelled=make_site("AV-003", name="Airport Road Gantry", region="Arusha", width_meters="12.5", height_meters=4),
        maintenance=make_site("AV-004", status=Billboard.Status.UNDER_MAINTANANCE),
        ended=make_site("AV-005", name="Kariakoo Wall", format=Billboard.Format.DIGITAL),
        unavailable=make_site("AV-006", status=Billboard.Status.UNAVAILABLE, region="Mwanza"),
    )
    contract(sites.booked, date(2026, 10, 1), date(2026, 10, 16), Contract.Status.ACTIVE)
    contract(sites.cancelled, date(2026, 10, 1), date(2026, 10, 16), Contract.Status.CANCELLED)
    # Its last day is 4 October, the day before the search's first day.
    contract(sites.ended, date(2026, 9, 1), date(2026, 10, 5), Contract.Status.ACTIVE)
    return sites


def web(user=None):
    client = WebClient()
    if user is not None:
        client.force_login(user)
    return client


def body(response):
    return response.content.decode(errors="replace")


def text(response):
    """The page as a reader sees it: tags gone, runs of white space collapsed."""
    return re.sub(r"\s+", " ", strip_tags(body(response)))


def listed(response):
    """Site codes in the results table, in page order."""
    return [row["billboard"].site_code for row in response.context["results"]["rows"]]


def counts(response):
    results = response.context["results"]
    return results["available"], results["booked"], results["not_for_sale"]


def errors_after(response):
    """The error banners on the page a redirect lands on."""
    assert response.redirect_chain, "expected a redirect back to the page"
    assert response.status_code == 200 and response["Content-Type"].startswith("text/html")
    return [str(message) for message in response.context["messages"]]


def post(client, ids, report_type="list", **extra):
    return client.post(URL, {**DATES, "report_type": report_type, "ids": [str(i) for i in ids], **extra}, follow=True)


# --------------------------------------------------------------------- access


@pytest.mark.django_db
class TestAccess:
    @pytest.mark.parametrize("who", ["admin", "sales", "superuser"])
    def test_allowed_roles_get_the_page_and_a_pdf(self, who, users, world):
        client = web(users[who])

        page = client.get(URL, DATES)
        assert page.status_code == 200
        assert page.context["title"] == "Availability"

        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            download = client.post(URL, {**DATES, "report_type": "list", "ids": [world.free.pk]})
        assert download.status_code == 200 and download["Content-Type"] == "application/pdf"
        assert render.call_count == 1

        # With nothing ticked the same people are sent back to the page.
        assert client.post(URL, {**DATES, "report_type": "list"}).status_code == 302

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_other_roles_get_403_on_get_and_post(self, role, users, world):
        client = web(users[role])

        assert client.get(URL, DATES).status_code == 403
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            response = client.post(URL, {**DATES, "report_type": "list", "ids": [world.free.pk]})
        assert response.status_code == 403
        assert render.call_count == 0
        assert CLIENT_NAME not in body(response)

    def test_anonymous_is_sent_to_the_admin_login(self, world):
        for response in (web().get(URL), web().post(URL, {**DATES, "report_type": "list", "ids": [world.free.pk]})):
            assert response.status_code == 302
            assert response["Location"].startswith("/admin/login/")

    def test_the_url_is_not_taken_for_a_billboard_id(self, users, world):
        # "<path:object_id>/" would answer with a redirect to the changelist and a "doesn't exist" message.
        response = web(users["admin"]).get(URL)
        assert response.status_code == 200
        assert response.templates[0].name == "admin/billboards/billboard/availability.html"


# --------------------------------------------------------------------- the page


@pytest.mark.django_db
class TestResults:
    @pytest.fixture
    def client(self, users):
        return web(users["sales"])

    def test_lists_what_is_free_and_counts_the_rest(self, client, world):
        response = client.get(URL, DATES)

        assert listed(response) == ["AV-001", "AV-003", "AV-005"]
        assert counts(response) == (3, 1, 2)
        assert "Available 3 · Booked 1 · Not for sale 2" in text(response)
        assert "Draft contracts also count as bookings. Sites under maintenance or unavailable are never listed." in text(response)

    def test_overlapping_contract_hides_the_site_and_counts_it_booked(self, client, world):
        response = client.get(URL, DATES)

        assert world.booked.site_code not in listed(response)
        assert world.booked.name not in body(response)
        assert counts(response)[1] == 1

    def test_draft_contract_counts_as_a_booking(self, client, world):
        Contract.objects.filter(billboard=world.booked).update(status=Contract.Status.DRAFT)

        assert world.booked.site_code not in listed(client.get(URL, DATES))

    def test_cancelled_contract_does_not_block(self, client, world):
        assert world.cancelled.site_code in listed(client.get(URL, DATES))

    def test_maintenance_site_is_absent_and_counted_not_for_sale(self, client, world):
        response = client.get(URL, DATES)

        assert world.maintenance.site_code not in listed(response)
        assert world.unavailable.site_code not in listed(response)
        assert counts(response)[2] == 2

    def test_contract_ending_the_day_before_does_not_block(self, client, world):
        assert world.ended.site_code in listed(client.get(URL, DATES))
        # One day earlier and its last day is inside the range.
        assert world.ended.site_code not in listed(client.get(URL, {"start": "2026-10-04", "end": END}))

    def test_single_day_range_works(self, client, world):
        response = client.get(URL, {"start": "2026-10-04", "end": "2026-10-04"})

        assert response.context["form"].is_valid()
        assert listed(response) == ["AV-001", "AV-003"]
        assert counts(response) == (2, 2, 2)

    def test_end_before_start_shows_an_error_and_lists_nothing(self, client, world):
        response = client.get(URL, {"start": END, "end": START})

        assert response.status_code == 200
        assert response.context["results"] is None
        assert "The last day must be on or after the first day." in body(response)
        assert "AV-001" not in body(response) and "Download list PDF" not in body(response)

    @pytest.mark.parametrize("params", [
        {"start": "not-a-date", "end": END},
        {"start": "", "end": ""},
        {"start": START},
        {**DATES, "format": "hologram"},
        {**DATES, "region": "Atlantis"},
        {"start": "2026-02-30", "end": "99999-01-01"},
    ])
    def test_bad_input_is_a_field_error_never_a_500(self, client, world, params):
        response = client.get(URL, params)

        assert response.status_code == 200
        assert response.context["results"] is None
        assert response.context["form"].errors
        assert "AV-001" not in body(response)

    def test_filter_by_format(self, client, world):
        response = client.get(URL, {**DATES, "format": "digital"})

        assert listed(response) == ["AV-005"]
        # Digital sites: ended (free) and booked. No digital site is off sale.
        assert counts(response) == (1, 1, 0)

    def test_filter_by_region(self, client, world):
        response = client.get(URL, {**DATES, "region": "Arusha"})

        assert listed(response) == ["AV-003"]
        assert counts(response) == (1, 1, 0)

    @pytest.mark.parametrize("query, expected", [
        ("av-005", ["AV-005"]),         # site code, any case
        ("UNIPOLE", ["AV-001"]),        # name
        ("str-77", ["AV-001"]),         # structure code
        ("ubungo", ["AV-001"]),         # address
        ("  gantry  ", ["AV-003"]),     # padding is ignored
        ("nothing-matches", []),
    ])
    def test_filter_by_search_text(self, client, world, query, expected):
        assert listed(client.get(URL, {**DATES, "q": query})) == expected

    def test_filters_combine(self, client, world):
        response = client.get(URL, {**DATES, "format": "static", "region": "Mwanza"})

        # The only static site in Mwanza is the unavailable one.
        assert listed(response) == []
        assert counts(response) == (0, 0, 1)
        assert "No sites are available for these dates." in body(response)
        assert "Download list PDF" not in body(response) and "Download detailed PDF" not in body(response)

    def test_region_choices_are_the_regions_in_the_database_sorted(self, client, world):
        choices = client.get(URL, DATES).context["form"].fields["region"].choices

        assert choices == [("", "All regions"), ("Arusha", "Arusha"), ("Dar es Salaam", "Dar es Salaam"), ("Mwanza", "Mwanza")]

    def test_default_load_searches_today_plus_thirty_days(self, client, world, monkeypatch):
        monkeypatch.setattr(admin_availability.timezone, "localdate", lambda: date(2026, 10, 5))

        response = client.get(URL)

        cleaned = response.context["form"].cleaned_data
        assert (cleaned["start"], cleaned["end"]) == (date(2026, 10, 5), date(2026, 11, 4))
        assert listed(response) == ["AV-001", "AV-003", "AV-005"]
        assert 'value="2026-10-05"' in body(response) and 'value="2026-11-04"' in body(response)

    def test_table_columns(self, client, world):
        response = client.get(URL, DATES)
        html, page = body(response), text(response)

        for heading in ("Site code", "Name", "Side", "Format", "Region", "Size", "Photo"):
            assert f'<th scope="col">{heading}</th>' in html
        assert f'<a href="/admin/billboards/billboard/{world.free.pk}/change/">Morogoro Road Unipole</a>' in html
        assert "6m × 3m" in page and "12.5m × 4m" in page
        assert "None" not in page
        # No thumbnails: they would be the full-size originals.
        assert "<img" not in html.split('class="availability"')[1]

    def test_photo_column_and_the_no_photo_line(self, client, world):
        Billboard.objects.filter(pk=world.free.pk).update(image="billboards/photo.jpg")

        response = client.get(URL, DATES)
        rows = {row["billboard"].site_code: row["has_photo"] for row in response.context["results"]["rows"]}

        assert rows == {"AV-001": True, "AV-003": False, "AV-005": False}
        assert response.context["results"]["without_photo"] == 2
        assert "2 of the 3 listed sites have no photo." in text(response)

    def test_every_box_is_ticked_to_begin_with(self, client, world):
        boxes = re.findall(r'<input type="checkbox" name="ids"[^>]*>', body(client.get(URL, DATES)))

        assert len(boxes) == 3 and all(" checked" in box for box in boxes)

    def test_page_has_the_csrf_token_both_buttons_and_the_filters(self, client, world):
        html = body(client.get(URL, {**DATES, "format": "static", "q": "road"}))

        assert 'name="csrfmiddlewaretoken"' in html
        assert re.search(r'<button[^>]*name="report_type"[^>]*value="list"[^>]*>\s*Download list PDF', html)
        assert re.search(r'<button[^>]*name="report_type"[^>]*value="detailed"[^>]*>\s*Download detailed PDF', html)
        for name, value in {**DATES, "format": "static", "region": "", "q": "road"}.items():
            assert f'<input type="hidden" name="{name}" value="{value}">' in html

    def test_csrf_is_enforced(self, users, world):
        client = WebClient(enforce_csrf_checks=True)
        client.force_login(users["sales"])

        assert client.post(URL, {**DATES, "report_type": "list", "ids": [world.free.pk]}).status_code == 403

    @pytest.mark.parametrize("params", [DATES, {"start": END, "end": START}, {**DATES, "q": "ZZ"}, {}])
    def test_client_name_never_appears(self, client, world, params):
        response = client.get(URL, params)

        assert response.status_code == 200
        assert CLIENT_NAME not in body(response)
        # The sidebar links to Contracts; the page itself mentions them once, in the note.
        page = strip_tags(body(response).split('class="availability"')[1])
        assert "contract" not in page.replace("Draft contracts also count as bookings.", "").lower()

    def test_query_count_does_not_grow_with_rows(self, client, world, django_assert_max_num_queries):
        with django_assert_max_num_queries(12) as few:
            client.get(URL, DATES)
        for n in range(40):
            make_site(f"BULK-{n:03d}")
        with django_assert_max_num_queries(12) as many:
            assert len(listed(client.get(URL, DATES))) == 43

        assert len(many) == len(few)


# --------------------------------------------------------------------- the PDF download


@pytest.mark.django_db
class TestDownload:
    @pytest.fixture
    def client(self, users):
        return web(users["sales"])

    @pytest.mark.parametrize("report_type", ["list", "detailed"])
    def test_renders_the_ticked_sites_for_the_dates(self, client, world, report_type):
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            response = client.post(URL, {**DATES, "report_type": report_type, "ids": [world.ended.pk, world.free.pk]})

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert response["Content-Disposition"] == f'attachment; filename="availability_{report_type}_{START}_to_{END}.pdf"'
        assert response.content == FAKE_PDF

        (billboards, start, end, kind), kwargs = render.call_args
        # Only the two ticked, in the model's order whatever order they were posted in.
        assert list(billboards) == [world.free, world.ended]
        assert (start, end, kind) == (date(2026, 10, 5), date(2026, 10, 10), report_type)
        assert kwargs == {"base_url": "http://testserver/"}

    def test_booked_and_unavailable_ids_are_dropped(self, client, world):
        ids = [world.free.pk, world.booked.pk, world.maintenance.pk, world.unavailable.pk, 999999]
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            client.post(URL, {**DATES, "report_type": "list", "ids": ids})

        assert list(render.call_args.args[0]) == [world.free]

    def test_ids_that_are_not_integers_are_ignored(self, client, world):
        ids = ["abc", "1.5", "", " ", "-3", "1e3", "²", f"{world.free.pk} OR 1=1", str(world.cancelled.pk)]
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            response = client.post(URL, {**DATES, "report_type": "list", "ids": ids})

        assert response.status_code == 200
        assert list(render.call_args.args[0]) == [world.cancelled]

    @pytest.mark.parametrize("ids", [[], ["abc"], "booked"])
    def test_nothing_usable_ticked_goes_back_with_an_error(self, client, world, ids):
        ids = [world.booked.pk] if ids == "booked" else ids
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            response = post(client, ids, format="static", q="road")

        assert errors_after(response) == ["Tick at least one available site."]
        assert render.call_count == 0
        # The filters came back with the redirect.
        assert response.redirect_chain[-1][0] == f"{URL}?start={START}&end={END}&format=static&q=road"

    def test_over_the_cap_goes_back_with_the_cap_message(self, client, world, monkeypatch):
        monkeypatch.setattr(pdf, "MAX_SITES_DETAILED_PDF", 2)
        monkeypatch.setattr(pdf, "MAX_SITES_LIST_PDF", 2)
        ids = [world.free.pk, world.cancelled.pk, world.ended.pk]

        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            detailed = post(client, ids, "detailed")
            listing = post(client, ids, "list")
            at_the_cap = client.post(URL, {**DATES, "report_type": "detailed", "ids": ids[:2]})

        assert errors_after(detailed) == [
            "The detailed report can include up to 2 sites. You selected 3. Untick some sites or use the list report."
        ]
        assert errors_after(listing) == [
            "The list report can include up to 2 sites. You selected 3. Untick some sites or narrow the filters."
        ]
        assert at_the_cap["Content-Type"] == "application/pdf"
        assert render.call_count == 1

    def test_a_render_failure_goes_back_with_a_message_not_a_traceback(self, client, world, caplog):
        with mock.patch(RENDERER, side_effect=RuntimeError("pango exploded")):
            response = post(client, [world.free.pk], "detailed")

        assert errors_after(response) == ["The PDF could not be generated. Try fewer sites."]
        assert "pango exploded" not in body(response) and "Traceback" not in body(response)
        assert "pango exploded" in caplog.text  # logged for whoever runs the server

    @pytest.mark.parametrize("fields", [
        {"start": END, "end": START},
        {"start": "nonsense", "end": END},
        {"start": "", "end": ""},
        {**DATES, "region": "Atlantis"},
    ])
    def test_invalid_filters_go_back_with_an_error(self, client, world, fields):
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            response = client.post(URL, {**fields, "report_type": "list", "ids": [world.free.pk]}, follow=True)

        assert errors_after(response) == ["Check the dates and filters, then try again."]
        assert render.call_count == 0
        # Blank dates leave nothing to carry back, so that case lands on the default search.
        if any(fields.values()):
            assert response.context["results"] is None

    @pytest.mark.parametrize("report_type", ["", "everything", None])
    def test_unknown_report_type_goes_back_with_an_error(self, client, world, report_type):
        data = {**DATES, "ids": [world.free.pk], **({} if report_type is None else {"report_type": report_type})}
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            response = client.post(URL, data, follow=True)

        assert errors_after(response) == ["Choose the list report or the detailed report."]
        assert render.call_count == 0

    def test_client_name_is_not_in_what_the_renderer_is_given(self, client, world):
        with mock.patch(RENDERER, return_value=FAKE_PDF) as render:
            client.post(URL, {**DATES, "report_type": "detailed", "ids": [world.free.pk, world.cancelled.pk]})

        billboards = render.call_args.args[0]
        for template_name in pdf.REPORT_TEMPLATES.values():
            from django.template.loader import render_to_string
            html = render_to_string(template_name, {"billboards": billboards, "start": START, "end": END})
            assert CLIENT_NAME not in html and "contract" not in html.lower()


# --------------------------------------------------------------------- billboards/pdf.py


class TestPdfModule:
    def test_caps(self):
        assert (pdf.MAX_SITES_LIST_PDF, pdf.MAX_SITES_DETAILED_PDF) == (1000, 10)

    @pytest.mark.parametrize("count, report_type", [(1000, "list"), (10, "detailed"), (0, "list"), (0, "detailed")])
    def test_at_or_under_the_cap_passes(self, count, report_type):
        pdf.check_site_count(count, report_type)

    def test_over_the_cap_raises_with_a_plain_message(self):
        with pytest.raises(pdf.TooManySitesError) as detailed:
            pdf.check_site_count(40, "detailed")
        with pytest.raises(pdf.TooManySitesError) as listing:
            pdf.check_site_count(1001, "list")

        assert str(detailed.value) == (
            "The detailed report can include up to 10 sites. You selected 40. Untick some sites or use the list report."
        )
        assert str(listing.value) == (
            "The list report can include up to 1000 sites. You selected 1001. Untick some sites or narrow the filters."
        )

    @pytest.mark.parametrize("report_type, template_name", [
        ("list", "billboards/availability_report.html"),
        ("detailed", "billboards/availability_report_detailed.html"),
    ])
    def test_picks_the_template_and_passes_the_base_url(self, report_type, template_name):
        with mock.patch.object(pdf, "render_to_string", return_value="<p>html</p>") as render, \
                mock.patch.object(pdf, "HTML") as html:
            html.return_value.write_pdf.return_value = FAKE_PDF
            result = pdf.render_availability_pdf(["site"], "a", "b", report_type, "http://host/")

        assert result == FAKE_PDF
        render.assert_called_once_with(template_name, {"billboards": ["site"], "start": "a", "end": "b"})
        html.assert_called_once_with(string="<p>html</p>", base_url="http://host/")

    @pytest.mark.skipif(WEASYPRINT_PROBLEM is not None, reason=f"WeasyPrint cannot load: {WEASYPRINT_PROBLEM}")
    @pytest.mark.django_db
    @pytest.mark.parametrize("report_type", ["list", "detailed"])
    def test_real_render_smoke(self, report_type):
        # Sites without photos: a photo would be fetched over HTTP from base_url.
        sites = [make_site("SMOKE-1", width_meters=6, height_meters=3, side="A"), make_site("SMOKE-2")]

        result = pdf.render_availability_pdf(sites, date(2026, 10, 5), date(2026, 10, 10), report_type, "http://testserver/")

        assert result.startswith(b"%PDF")


# --------------------------------------------------------------------- the API, unchanged


API_PDF = "/api/billboards/availability_pdf/"
API_RENDERER = "billboards.views.render_availability_pdf"


@pytest.mark.django_db
class TestApiRegression:
    def test_available_json_is_unchanged(self, world):
        response = APIClient().get("/api/billboards/available/", DATES)

        assert response.status_code == 200
        assert [site["site_code"] for site in response.data] == ["AV-001", "AV-003", "AV-005"]
        first = response.data[0]
        assert first["id"] == world.free.pk and first["format_display"] == "Static" and first["status_display"] == "Available"
        assert CLIENT_NAME not in body(response)

    def test_available_still_refuses_a_single_day(self, world):
        # The API's rule is start before end. The admin page's "same day is fine" did not change it.
        response = APIClient().get("/api/billboards/available/", {"start": START, "end": START})

        assert response.status_code == 400

    @pytest.mark.parametrize("report_type", ["list", "detailed", None])
    def test_pdf_endpoint_still_answers_with_a_pdf(self, world, report_type):
        params = {**DATES, **({"report_type": report_type} if report_type else {})}
        expected_type = report_type or "list"
        with mock.patch(API_RENDERER, return_value=FAKE_PDF) as render:
            response = APIClient().get(API_PDF, params)

        assert response.status_code == 200
        assert response["Content-Type"] == "application/pdf"
        assert response["Content-Disposition"] == f'attachment; filename="availability_{expected_type}_{START}_to_{END}.pdf"'
        assert response.content == FAKE_PDF

        (billboards, start, end, kind), kwargs = render.call_args
        # Every available site, as before: the API has no ticking and no filters.
        assert list(billboards) == [world.free, world.cancelled, world.ended]
        assert (start, end, kind) == (date(2026, 10, 5), date(2026, 10, 10), expected_type)
        assert kwargs == {"base_url": "http://testserver/"}

    def test_pdf_endpoint_over_the_cap_is_a_400_with_the_message(self, world, monkeypatch):
        monkeypatch.setattr(pdf, "MAX_SITES_DETAILED_PDF", 2)
        with mock.patch(API_RENDERER, return_value=FAKE_PDF) as render:
            detailed = APIClient().get(API_PDF, {**DATES, "report_type": "detailed"})
            listing = APIClient().get(API_PDF, {**DATES, "report_type": "list"})

        assert detailed.status_code == 400
        assert detailed.json() == {
            "detail": "The detailed report can include up to 2 sites. You selected 3. Untick some sites or use the list report."
        }
        # The list cap was not lowered, so the list report is unaffected.
        assert listing.status_code == 200 and render.call_count == 1

    def test_pdf_endpoint_still_validates_its_query(self, world):
        with mock.patch(API_RENDERER, return_value=FAKE_PDF):
            assert APIClient().get(API_PDF, {"start": END, "end": START}).status_code == 400
            assert APIClient().get(API_PDF, {**DATES, "report_type": "poster"}).status_code == 400


# --------------------------------------------------------------------- sidebar


def sidebar_hrefs(client):
    return re.findall(r'<a[^>]*href="([^"]+)"', body(client.get("/admin/")))


@pytest.mark.django_db
class TestSidebarLink:
    @pytest.mark.parametrize("who", ["admin", "sales", "superuser"])
    def test_shown_and_opens(self, who, users, world):
        client = web(users[who])

        assert URL in sidebar_hrefs(client)
        assert client.get(URL).status_code == 200

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_absent(self, role, users, world):
        client = web(users[role])

        assert URL not in sidebar_hrefs(client)
        # Billboards, the other link in that group, is still there for them.
        assert "/admin/billboards/billboard/" in sidebar_hrefs(client)

    @pytest.mark.parametrize("path, lit", [
        (URL, "Availability"),
        (URL + "?start=2026-10-05&end=2026-10-10", "Availability"),
        ("/admin/billboards/billboard/", "Billboards"),
        ("/admin/billboards/billboard/add/", "Billboards"),
        ("change", "Billboards"),
        ("/admin/clients/client/", None),
    ])
    def test_only_the_page_you_are_on_is_highlighted(self, users, world, path, lit):
        path = f"/admin/billboards/billboard/{world.free.pk}/change/" if path == "change" else path
        html = body(web(users["admin"]).get(path))
        # Unfold marks the current link by ending its class list with "active".
        active = re.findall(r'<a href="([^"]+)" class="[^"]* active"', html)

        assert ("/admin/billboards/billboard/" in active) == (lit == "Billboards")
        assert (URL in active) == (lit == "Availability")

    def test_sits_directly_after_billboards(self, users, world):
        html = body(web(users["admin"]).get("/admin/"))
        order = [html.index(f'href="{href}"') for href in ("/admin/billboards/billboard/", URL, "/admin/clients/client/")]

        assert order == sorted(order)
