import pytest
from rest_framework.test import APIClient

from billboards.models import Billboard


@pytest.fixture
def billboard(db):
    return Billboard.objects.create(
        site_code="PERM-001", name="Permission Test Site", format=Billboard.Format.STATIC,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28, width_meters=6, height_meters=3,
    )


@pytest.mark.django_db
class TestBillboardPermissions:
    def test_anonymous_can_read(self, billboard):
        assert APIClient().get("/api/billboards/").status_code == 200

    def test_anonymous_cannot_write(self):
        assert APIClient().post("/api/billboards/", {}, format="json").status_code == 401

    def test_sales_cannot_write_billboards(self, sales_user):
        api = APIClient()
        api.force_authenticate(user=sales_user)
        assert api.post("/api/billboards/", {}, format="json").status_code == 403


@pytest.mark.django_db
class TestJobPermissions:
    def test_sales_cannot_write_jobs(self, sales_user, billboard):
        api = APIClient()
        api.force_authenticate(user=sales_user)
        response = api.post("/api/jobs/", {
            "billboard": billboard.id, "job_type": "installation",
            "status": "pending", "priority": "medium", "scheduled_date": "2026-09-01",
        }, format="json")
        assert response.status_code == 403

    def test_operations_can_write_jobs(self, operations_user, billboard):
        api = APIClient()
        api.force_authenticate(user=operations_user)
        response = api.post("/api/jobs/", {
            "billboard": billboard.id, "job_type": "installation",
            "status": "pending", "priority": "medium", "scheduled_date": "2026-09-01",
        }, format="json")
        assert response.status_code == 201
