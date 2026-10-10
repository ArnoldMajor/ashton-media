from django.test import TestCase
from datetime import date
from decimal import Decimal

import pytest
from django.template.loader import render_to_string
from rest_framework.test import APIClient
from django.db.backends.postgresql.psycopg_any import DateRange

from clients.models import Client
from contracts.models import Contract
from .models import Billboard
from .services import get_available_billboards


@pytest.fixture
def billboard(db):
    return Billboard.objects.create(
        site_code="TEST-001", name="Test Site", format=Billboard.Format.STATIC,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28, width_meters=6, height_meters=3,
    )


@pytest.fixture
def test_client_obj(db):
    return Client.objects.create(company_name="Test Co", contact_name="Jane", email="jane@test.com")


@pytest.mark.django_db
class TestAvailabilityEngine:
    def test_excluded_when_contract_overlaps(self, billboard, test_client_obj):
        Contract.objects.create(
            billboard=billboard, client=test_client_obj,
            date_range=DateRange(date(2026, 10, 1), date(2026, 10, 15)),
            status=Contract.Status.ACTIVE,
        )
        result = get_available_billboards(date(2026, 10, 5), date(2026, 10, 10))
        assert billboard not in result

    def test_included_when_no_overlap(self, billboard, test_client_obj):
        Contract.objects.create(
            billboard=billboard, client=test_client_obj,
            date_range=DateRange(date(2026, 10, 1), date(2026, 10, 15)),
            status=Contract.Status.ACTIVE,
        )
        result = get_available_billboards(date(2026, 11, 1), date(2026, 11, 5))
        assert billboard in result

    def test_cancelled_contract_does_not_block(self, billboard, test_client_obj):
        Contract.objects.create(
            billboard=billboard, client=test_client_obj,
            date_range=DateRange(date(2026, 10, 1), date(2026, 10, 15)),
            status=Contract.Status.CANCELLED,
        )
        result = get_available_billboards(date(2026, 10, 5), date(2026, 10, 10))
        assert billboard in result

    def test_under_maintenance_never_available(self, billboard):
        billboard.status = Billboard.Status.UNDER_MAINTANANCE
        billboard.save()
        result = get_available_billboards(date(2026, 12, 1), date(2026, 12, 5))
        assert billboard not in result


REPORT_TEMPLATES = [
    "billboards/availability_report.html",
    "billboards/availability_report_detailed.html",
]


@pytest.fixture
def unsized_billboard(db):
    return Billboard.objects.create(
        site_code="TEST-DIG-001", name="Digital Screen", format=Billboard.Format.DIGITAL,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28,
    )


def render_report(template_name, billboard):
    return render_to_string(template_name, {
        "billboards": [billboard], "start": date(2026, 10, 1), "end": date(2026, 10, 15),
    })


@pytest.mark.django_db
class TestOptionalSize:
    def test_digital_billboard_saves_without_size(self, unsized_billboard):
        unsized_billboard.refresh_from_db()
        unsized_billboard.full_clean()  # blank=True: passes form/importer validation too
        assert unsized_billboard.width_meters is None
        assert unsized_billboard.height_meters is None

    def test_api_create_without_size(self, admin_user):
        api = APIClient()
        api.force_authenticate(user=admin_user)
        response = api.post("/api/billboards/", {
            "site_code": "API-DIG-001", "name": "API Digital Screen", "format": "digital",
            "region": "Dar es Salaam", "address": "Test Rd",
            "latitude": "-6.8", "longitude": "39.28",
        }, format="json")
        assert response.status_code == 201, response.data
        assert response.data["width_meters"] is None
        assert response.data["height_meters"] is None

    @pytest.mark.parametrize("template_name", REPORT_TEMPLATES)
    def test_report_never_prints_none_without_size(self, unsized_billboard, template_name):
        html = render_report(template_name, unsized_billboard)
        assert unsized_billboard.site_code in html
        assert "None" not in html

    def test_detailed_report_omits_size_line_without_size(self, unsized_billboard):
        assert "Size:" not in render_report(REPORT_TEMPLATES[1], unsized_billboard)

    def test_list_report_shows_dash_without_size(self, unsized_billboard):
        assert "<td>—</td>" in render_report(REPORT_TEMPLATES[0], unsized_billboard)

    def test_reports_still_show_size(self, billboard):
        billboard.refresh_from_db()  # Decimal("6.00") as it comes from the DB
        assert "6.00m × 3.00m" in render_report(REPORT_TEMPLATES[0], billboard)
        assert "3.00m (h) x 6.00m (w)" in render_report(REPORT_TEMPLATES[1], billboard)


class TestImportOptionalDecimal:
    def test_blank_cells_become_none(self):
        from billboards.management.commands.import_billboards import optional_decimal

        assert optional_decimal("") is None
        assert optional_decimal("   ") is None
        assert optional_decimal(None) is None
        assert optional_decimal(" 6.5 ") == Decimal("6.5")
