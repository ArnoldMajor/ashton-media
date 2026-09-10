from django.test import TestCase
from datetime import date

import pytest
from django.db.backends.postgresql.psycopg_any import DateRange
from rest_framework.test import APIClient

from billboards.models import Billboard
from clients.models import Client
from .models import Contract


@pytest.fixture
def billboard(db):
    return Billboard.objects.create(
        site_code="TEST-200", name="Contract Test Site", format=Billboard.Format.STATIC,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28, width_meters=6, height_meters=3,
    )


@pytest.fixture
def test_client_obj(db):
    return Client.objects.create(company_name="Acme Ltd", contact_name="Jane", email="jane@acme.com")


@pytest.mark.django_db
class TestContractOverlapValidation:
    def test_overlapping_contract_rejected_with_clean_400(self, sales_user, billboard, test_client_obj):
        Contract.objects.create(
            billboard=billboard, client=test_client_obj,
            date_range=DateRange(date(2026, 10, 1), date(2026, 10, 15)),
            status=Contract.Status.ACTIVE,
        )
        api = APIClient()
        api.force_authenticate(user=sales_user)
        response = api.post("/api/contracts/", {
            "billboard": billboard.id, "client": test_client_obj.id,
            "date_range": {"lower": "2026-10-05", "upper": "2026-10-10"},
            "status": "active",
        }, format="json")
        assert response.status_code == 400
        assert "date_range" in response.data

    def test_non_overlapping_contract_accepted(self, sales_user, billboard, test_client_obj):
        api = APIClient()
        api.force_authenticate(user=sales_user)
        response = api.post("/api/contracts/", {
            "billboard": billboard.id, "client": test_client_obj.id,
            "date_range": {"lower": "2026-11-01", "upper": "2026-11-05"},
            "status": "active",
        }, format="json")
        assert response.status_code == 201


@pytest.mark.django_db
class TestContractPermissions:
    def test_design_cannot_create_contract(self, design_user, billboard, test_client_obj):
        api = APIClient()
        api.force_authenticate(user=design_user)
        response = api.post("/api/contracts/", {
            "billboard": billboard.id, "client": test_client_obj.id,
            "date_range": {"lower": "2026-11-01", "upper": "2026-11-05"},
            "status": "active",
        }, format="json")
        assert response.status_code == 403

    def test_operations_can_read_but_not_write(self, operations_user, billboard, test_client_obj):
        api = APIClient()
        api.force_authenticate(user=operations_user)
        assert api.get("/api/contracts/").status_code == 200
        response = api.post("/api/contracts/", {
            "billboard": billboard.id, "client": test_client_obj.id,
            "date_range": {"lower": "2026-11-01", "upper": "2026-11-05"},
            "status": "active",
        }, format="json")
        assert response.status_code == 403
