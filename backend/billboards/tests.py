from django.test import TestCase
from datetime import date

import pytest
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
