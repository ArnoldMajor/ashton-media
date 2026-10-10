import pytest
from django.contrib.auth import get_user_model
from django.db.backends.postgresql.psycopg_any import DateRange
from django.urls import reverse
from datetime import date

from billboards.models import Billboard
from clients.models import Client
from contracts.models import Contract

User = get_user_model()

HEADING = "Can't delete yet"


@pytest.fixture
def admin_superuser(db):
    return User.objects.create_superuser(username="admin_super_test", password="x", role="admin")


@pytest.fixture
def billboard(db):
    return Billboard.objects.create(
        site_code="DEL-001", name="Delete Notice Site", format=Billboard.Format.STATIC,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28, width_meters=6, height_meters=3,
    )


@pytest.fixture
def contract(db, billboard):
    client = Client.objects.create(
        company_name="Delete Notice Co", contact_name="Test Contact", email="contact@example.com",
    )
    return Contract.objects.create(
        billboard=billboard, client=client,
        date_range=DateRange(date(2026, 9, 1), date(2026, 10, 1)),
    )


@pytest.mark.django_db
class TestDeleteBlockedNotice:
    def test_bulk_delete_shows_notice_and_back_link(self, client, admin_superuser, billboard, contract):
        client.force_login(admin_superuser)
        changelist_url = reverse("admin:billboards_billboard_changelist")

        response = client.post(changelist_url, {
            "action": "delete_selected", "_selected_action": billboard.pk,
        })
        html = response.content.decode()

        assert response.status_code == 200
        assert HEADING in html
        assert f'<a href="{changelist_url}"' in html
        # The blocking contract links to its change page.
        assert reverse("admin:contracts_contract_change", args=[contract.pk]) in html
        assert Billboard.objects.filter(pk=billboard.pk).exists()

    def test_single_delete_shows_notice_and_back_link(self, client, admin_superuser, billboard, contract):
        client.force_login(admin_superuser)
        change_url = reverse("admin:billboards_billboard_change", args=[billboard.pk])

        response = client.get(reverse("admin:billboards_billboard_delete", args=[billboard.pk]))
        html = response.content.decode()

        assert response.status_code == 200
        assert HEADING in html
        assert f'<a href="{change_url}"' in html
        assert reverse("admin:contracts_contract_change", args=[contract.pk]) in html

    def test_unprotected_delete_keeps_normal_confirmation(self, client, admin_superuser, billboard):
        client.force_login(admin_superuser)

        response = client.get(reverse("admin:billboards_billboard_delete", args=[billboard.pk]))
        html = response.content.decode()

        assert response.status_code == 200
        assert HEADING not in html
        assert "delete-blocked-notice" not in html
        assert 'name="post" value="yes"' in html
