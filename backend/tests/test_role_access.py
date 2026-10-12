"""
Who can see and do what, by role.

1. Client, contract and inquiry data is for admin and sales only. Design and
   operations get none of it: not pages, not the API, not counts, not names.
2. Jobs: only admin creates, edits, assigns, links to contracts or deletes.
   Operations (field crew) see only their own jobs and change only the status.
"""
import re
from datetime import date
from types import SimpleNamespace

import pytest
from django.contrib.admin.helpers import ACTION_CHECKBOX_NAME
from django.contrib.admin.utils import flatten_fieldsets
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.storage import FileSystemStorage, storages
from django.db.backends.postgresql.psycopg_any import DateRange
from django.test import Client as WebClient
from django.urls import reverse
from rest_framework.test import APIClient

from billboards.models import Billboard
from clients.models import Client
from contracts.models import Contract
from inquiries.models import Inquiry
from jobs.models import Job
from users.permissions import (
    OPERATIONS_ALLOWED_STATUSES,
    OPERATIONS_JOB_FIELDS,
    SALES_DATA_ROLES,
    user_can_see_sales_data,
)

User = get_user_model()

CLIENT_NAME = "ZZ Leak Test Co"
INQUIRER = "ZZ Inquirer"
LEAKS = (CLIENT_NAME, INQUIRER)

GROUPS = ["Overview", "Sales & Bookings", "Operations", "Marketing", "Administration"]
SIDEBAR = {
    "Dashboard": "/admin/",
    "Billboards": "/admin/billboards/billboard/",
    "Clients": "/admin/clients/client/",
    "Contracts": "/admin/contracts/contract/",
    "Inquiries": "/admin/inquiries/inquiry/",
    "Jobs": "/admin/jobs/job/",
    "Blog Posts": "/admin/blog/blogpost/",
    "Site Images": "/admin/sitecontent/siteimage/",
    "Case Studies": "/admin/casestudies/casestudy/",
    "Staff Accounts": "/admin/users/user/",
}


@pytest.fixture(autouse=True)
def local_media(settings, tmp_path):
    """Nothing here uploads a file, but no test in this project may be able to reach R2."""
    settings.STORAGES = {
        **settings.STORAGES,
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    }
    settings.MEDIA_ROOT = tmp_path
    assert type(storages["default"]) is FileSystemStorage


@pytest.fixture(autouse=True)
def fresh_throttle():
    """The inquiry throttle counts in the cache; start each test from zero."""
    cache.clear()


@pytest.fixture
def superuser(db):
    # A superuser whose role is not admin or sales: the admin lets them in
    # everywhere, the API judges them by role alone.
    return User.objects.create_superuser(username="super_test", password="x", role="design")


@pytest.fixture
def users(admin_user, sales_user, operations_user, design_user):
    return {"admin": admin_user, "sales": sales_user, "operations": operations_user, "design": design_user}


@pytest.fixture
def world(db, operations_user):
    """A client, a contract, an inquiry, and two jobs: one for our operations user, one for a colleague."""
    billboard = Billboard.objects.create(
        site_code="ROLE-001", name="Role Test Site", format=Billboard.Format.STATIC,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28,
    )
    other_billboard = Billboard.objects.create(
        site_code="ROLE-002", name="Other Site", format=Billboard.Format.DIGITAL,
        status=Billboard.Status.AVAILABLE, region="Arusha", address="Other Rd",
        latitude=-3.37, longitude=36.68,
    )
    client = Client.objects.create(company_name=CLIENT_NAME, contact_name="Jane", email="jane@zz.test")
    contract = Contract.objects.create(
        billboard=billboard, client=client, status=Contract.Status.ACTIVE,
        date_range=DateRange(date(2026, 9, 1), date(2026, 10, 1)),
    )
    inquiry = Inquiry.objects.create(name=INQUIRER, email="zz@inquirer.test", message="Hello")
    colleague = User.objects.create_user(username="ops_colleague", password="x", role="operations", is_staff=True, is_active=True)
    own_job = Job.objects.create(
        billboard=billboard, contract=contract, assigned_to=operations_user,
        job_type=Job.JobType.INSTALLATION, scheduled_date=date(2026, 9, 1), description="Install the Vodacom skin",
    )
    other_job = Job.objects.create(
        billboard=other_billboard, assigned_to=colleague,
        job_type=Job.JobType.INSPECTION, scheduled_date=date(2026, 9, 2),
    )
    return SimpleNamespace(
        billboard=billboard, other_billboard=other_billboard, client=client, contract=contract,
        inquiry=inquiry, colleague=colleague, own_job=own_job, other_job=other_job,
    )


def web(user=None):
    client = WebClient()
    if user is not None:
        client.force_login(user)
    return client


def api(user=None):
    client = APIClient()
    if user is not None:
        client.force_authenticate(user=user)
    return client


def body(response):
    return response.content.decode(errors="replace")


def assert_no_leak(response):
    text = body(response)
    for name in LEAKS:
        assert name not in text, f"{name!r} appears in a {response.status_code} response"


def admin_url(model, view, *args):
    return reverse(f"admin:{model._meta.app_label}_{model._meta.model_name}_{view}", args=args)


def autocomplete(client, app, model, field, term="ZZ"):
    return client.get("/admin/autocomplete/", {"app_label": app, "model_name": model, "field_name": field, "term": term})


def job_payload(world, **overrides):
    return {
        "billboard": world.billboard.id, "job_type": "installation", "status": "pending",
        "priority": "medium", "scheduled_date": "2026-11-01", **overrides,
    }


# --------------------------------------------------------------------- the shared rules


def test_one_source_of_truth(db, users, superuser):
    assert SALES_DATA_ROLES == ["admin", "sales"]
    assert OPERATIONS_JOB_FIELDS == ["status"]
    assert OPERATIONS_ALLOWED_STATUSES == ["pending", "in_progress", "completed"]
    assert {role: user_can_see_sales_data(user) for role, user in users.items()} == {
        "admin": True, "sales": True, "operations": False, "design": False,
    }
    # No superuser bypass, and nobody who isn't signed in.
    assert user_can_see_sales_data(superuser) is False
    assert user_can_see_sales_data(None) is False


# --------------------------------------------------------------------- clients, contracts, inquiries: admin pages


@pytest.mark.django_db
class TestSalesDataAdminPages:
    def object_urls(self, world):
        urls = []
        for obj in (world.client, world.contract, world.inquiry):
            model = type(obj)
            urls += [
                admin_url(model, "changelist"), admin_url(model, "add"), admin_url(model, "change", obj.pk),
                admin_url(model, "delete", obj.pk), admin_url(model, "history", obj.pk),
            ]
        return urls

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_hidden_from_design_and_operations(self, role, users, world):
        client = web(users[role])

        for url in self.object_urls(world):
            response = client.get(url)
            assert response.status_code == 403, f"{role} GET {url} -> {response.status_code}"
            assert_no_leak(response)
        for url in ("/admin/clients/", "/admin/contracts/", "/admin/inquiries/"):
            response = client.get(url)
            assert response.status_code == 404, f"{role} GET {url} -> {response.status_code}"
            assert_no_leak(response)

        # Writes are refused too, not only reads.
        for obj in (world.client, world.contract, world.inquiry):
            assert client.post(admin_url(type(obj), "delete", obj.pk), {"post": "yes"}).status_code == 403
            assert client.post(admin_url(type(obj), "changelist"), {
                "action": "delete_selected", ACTION_CHECKBOX_NAME: obj.pk,
            }).status_code == 403
        assert (Client.objects.count(), Contract.objects.count(), Inquiry.objects.count()) == (1, 1, 1)

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_autocomplete_gives_no_names(self, role, users, world):
        client = web(users[role])

        for app, model, field in (("contracts", "contract", "client"), ("jobs", "job", "contract")):
            response = autocomplete(client, app, model, field)
            assert response.status_code == 403, f"{role} autocomplete {app}.{model}.{field} -> {response.status_code}"
            assert_no_leak(response)

    @pytest.mark.parametrize("role", ["admin", "sales"])
    def test_admin_and_sales_still_work(self, role, users, world):
        client = web(users[role])

        for obj, name in ((world.client, CLIENT_NAME), (world.contract, CLIENT_NAME), (world.inquiry, INQUIRER)):
            model = type(obj)
            listing = client.get(admin_url(model, "changelist"))
            assert listing.status_code == 200 and name in body(listing)
            assert client.get(admin_url(model, "add")).status_code == 200
            assert client.get(admin_url(model, "change", obj.pk)).status_code == 200
        assert client.get("/admin/clients/").status_code == 200
        assert client.get("/admin/contracts/").status_code == 200
        found = autocomplete(client, "contracts", "contract", "client")
        assert found.status_code == 200 and CLIENT_NAME in body(found)

    def test_anonymous_is_sent_to_login(self, world):
        for url in (admin_url(Client, "changelist"), admin_url(Contract, "changelist"), admin_url(Inquiry, "changelist")):
            response = web().get(url)
            assert response.status_code == 302 and "/admin/login/" in response["Location"]

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_billboard_delete_page_does_not_name_the_client(self, role, users, world):
        # Operations may delete billboards. A billboard under contract can't be
        # deleted, and the page that says so must not say whose contract it is.
        response = web(users[role]).get(admin_url(Billboard, "delete", world.billboard.pk))

        assert_no_leak(response)


# --------------------------------------------------------------------- clients, contracts, inquiries: API


@pytest.mark.django_db
class TestSalesDataApi:
    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_everything_is_403_for_design_and_operations(self, role, users, world):
        client = api(users[role])
        calls = [
            ("get", "/api/clients/", None), ("get", f"/api/clients/{world.client.id}/", None),
            ("post", "/api/clients/", {"company_name": "New Co", "contact_name": "A", "email": "a@b.co"}),
            ("patch", f"/api/clients/{world.client.id}/", {"notes": "x"}), ("delete", f"/api/clients/{world.client.id}/", None),
            ("get", "/api/contracts/", None), ("get", f"/api/contracts/{world.contract.id}/", None),
            ("post", "/api/contracts/", {"billboard": world.other_billboard.id, "client": world.client.id,
                                         "date_range": {"lower": "2027-01-01", "upper": "2027-02-01"}, "status": "draft"}),
            ("patch", f"/api/contracts/{world.contract.id}/", {"notes": "x"}), ("delete", f"/api/contracts/{world.contract.id}/", None),
            ("get", "/api/inquiries/", None), ("get", f"/api/inquiries/{world.inquiry.id}/", None),
            ("patch", f"/api/inquiries/{world.inquiry.id}/", {"message": "x"}), ("delete", f"/api/inquiries/{world.inquiry.id}/", None),
        ]

        for method, url, data in calls:
            response = getattr(client, method)(url, data, format="json")
            assert response.status_code == 403, f"{role} {method.upper()} {url} -> {response.status_code}"
            assert_no_leak(response)
        assert (Client.objects.count(), Contract.objects.count(), Inquiry.objects.count()) == (1, 1, 1)

    @pytest.mark.parametrize("role", ["admin", "sales"])
    def test_admin_and_sales_still_work(self, role, users, world):
        client = api(users[role])

        assert CLIENT_NAME in body(client.get("/api/clients/"))
        assert client.get(f"/api/clients/{world.client.id}/").status_code == 200
        assert CLIENT_NAME in body(client.get("/api/contracts/"))
        assert INQUIRER in body(client.get("/api/inquiries/"))
        assert client.get(f"/api/inquiries/{world.inquiry.id}/").status_code == 200

        created = client.post("/api/clients/", {"company_name": "New Co", "contact_name": "A", "email": "a@b.co"}, format="json")
        assert created.status_code == 201
        assert client.patch(f"/api/clients/{created.json()['id']}/", {"notes": "called"}, format="json").status_code == 200

        # A contract for a free billboard is fine; one that overlaps an existing booking is refused.
        free = client.post("/api/contracts/", {
            "billboard": world.other_billboard.id, "client": world.client.id,
            "date_range": {"lower": "2027-01-01", "upper": "2027-02-01"}, "status": "draft",
        }, format="json")
        assert free.status_code == 201
        clash = client.post("/api/contracts/", {
            "billboard": world.billboard.id, "client": world.client.id,
            "date_range": {"lower": "2026-09-15", "upper": "2026-09-20"}, "status": "draft",
        }, format="json")
        assert clash.status_code == 400 and "date_range" in clash.json()
        assert client.delete(f"/api/contracts/{free.json()['id']}/").status_code == 204

    def test_superuser_gets_no_bypass_on_the_api(self, superuser, world):
        client = api(superuser)  # role: design

        for url in ("/api/clients/", "/api/contracts/", "/api/inquiries/"):
            response = client.get(url)
            assert response.status_code == 403
            assert_no_leak(response)

    def test_anonymous(self, world):
        for url in ("/api/clients/", "/api/contracts/", "/api/inquiries/", "/api/jobs/"):
            response = api().get(url)
            assert response.status_code == 401
            assert_no_leak(response)

        # The public contact form still posts.
        posted = api().post("/api/inquiries/", {"name": "A Visitor", "email": "v@example.com", "message": "Hi"}, format="json")
        assert posted.status_code == 201

    def test_anonymous_inquiries_are_still_throttled(self, world):
        statuses = [
            api().post("/api/inquiries/", {"name": f"V{n}", "email": "v@example.com", "message": "Hi"}, format="json").status_code
            for n in range(6)
        ]

        assert statuses == [201, 201, 201, 201, 201, 429]


# --------------------------------------------------------------------- jobs: operations


@pytest.mark.django_db
class TestJobsOperationsApi:
    @pytest.fixture
    def client(self, operations_user):
        return api(operations_user)

    def test_cannot_create_replace_or_delete(self, client, world, operations_user):
        assert client.post("/api/jobs/", job_payload(world), format="json").status_code == 403
        assert client.put(f"/api/jobs/{world.own_job.id}/", job_payload(world), format="json").status_code == 403
        assert client.delete(f"/api/jobs/{world.own_job.id}/").status_code == 403
        assert client.delete(f"/api/jobs/{world.other_job.id}/").status_code == 403
        assert Job.objects.count() == 2

    def test_sees_only_own_jobs(self, client, world):
        listed = client.get("/api/jobs/")

        assert listed.status_code == 200
        assert [job["id"] for job in listed.json()] == [world.own_job.id]
        assert client.get(f"/api/jobs/{world.own_job.id}/").status_code == 200
        assert client.get(f"/api/jobs/{world.other_job.id}/").status_code == 404
        assert client.patch(f"/api/jobs/{world.other_job.id}/", {"status": "completed"}, format="json").status_code == 404
        world.other_job.refresh_from_db()
        assert world.other_job.status == "pending"

    def test_can_move_own_job_through_its_statuses(self, client, world):
        for status in ("in_progress", "completed", "pending"):
            response = client.patch(f"/api/jobs/{world.own_job.id}/", {"status": status}, format="json")
            assert response.status_code == 200 and response.json()["status"] == status
        world.own_job.refresh_from_db()
        assert world.own_job.status == "pending"

    def test_other_fields_are_ignored_not_changed(self, client, world):
        job = world.own_job
        before = Job.objects.filter(pk=job.pk).values().get()

        response = client.patch(f"/api/jobs/{job.id}/", {
            "actual_hours": "9.50", "estimated_hours": "1.00", "priority": "high",
            "assigned_to": world.colleague.id, "contract": None, "billboard": world.other_billboard.id,
            "scheduled_date": "2030-01-01", "description": "rewritten", "job_type": "removal",
            "completed_at": "2030-01-01T00:00:00Z", "created_by": world.colleague.id,
        }, format="json")

        assert response.status_code == 200
        after = Job.objects.filter(pk=job.pk).values().get()
        assert {k: v for k, v in after.items() if k != "updated_at"} == {k: v for k, v in before.items() if k != "updated_at"}
        # The link to the client's contract survives, though they can't see it.
        assert after["contract_id"] == world.contract.id

    def test_status_change_keeps_the_contract_link(self, client, world):
        assert client.patch(f"/api/jobs/{world.own_job.id}/", {"status": "completed"}, format="json").status_code == 200

        world.own_job.refresh_from_db()
        assert world.own_job.status == "completed"
        assert world.own_job.contract.client.company_name == CLIENT_NAME

    def test_cannot_cancel(self, client, world):
        response = client.patch(f"/api/jobs/{world.own_job.id}/", {"status": "cancelled"}, format="json")

        assert response.status_code == 400
        assert "Only an admin can cancel a job" in response.json()["status"][0]
        world.own_job.refresh_from_db()
        assert world.own_job.status == "pending"

    def test_cannot_reopen_a_cancelled_job(self, client, world):
        Job.objects.filter(pk=world.own_job.pk).update(status=Job.Status.CANCELLED)

        response = client.patch(f"/api/jobs/{world.own_job.id}/", {"status": "in_progress"}, format="json")

        assert response.status_code == 400
        assert "has been cancelled" in response.json()["status"][0]
        world.own_job.refresh_from_db()
        assert world.own_job.status == "cancelled"

    def test_json_never_carries_the_contract(self, client, world):
        responses = [
            client.get("/api/jobs/"), client.get(f"/api/jobs/{world.own_job.id}/"),
            client.patch(f"/api/jobs/{world.own_job.id}/", {"status": "in_progress"}, format="json"),
        ]

        for response in responses:
            rows = response.json() if isinstance(response.json(), list) else [response.json()]
            assert all("contract" not in row for row in rows)
            assert_no_leak(response)

    def test_kpis_are_refused(self, client, world):
        assert client.get("/api/jobs/kpis/").status_code == 403


@pytest.mark.django_db
class TestJobsOperationsAdmin:
    @pytest.fixture
    def client(self, operations_user):
        return web(operations_user)

    def test_cannot_add_or_delete(self, client, world):
        assert client.get(admin_url(Job, "add")).status_code == 403
        assert client.post(admin_url(Job, "add"), {"billboard": world.billboard.id, "job_type": "installation", "status": "pending",
                                                    "priority": "medium", "scheduled_date": "2026-11-01"}).status_code == 403
        assert client.get(admin_url(Job, "delete", world.own_job.pk)).status_code == 403
        assert client.post(admin_url(Job, "delete", world.own_job.pk), {"post": "yes"}).status_code == 403
        client.post(admin_url(Job, "changelist"), {"action": "delete_selected", ACTION_CHECKBOX_NAME: world.own_job.pk})
        assert Job.objects.count() == 2

    def test_changelist_lists_only_own_jobs(self, client, world):
        response = client.get(admin_url(Job, "changelist"))

        assert response.status_code == 200
        assert list(response.context["cl"].result_list) == [world.own_job]
        assert "ROLE-001" in body(response) and "ROLE-002" not in body(response)
        assert_no_leak(response)

    def test_someone_elses_job_is_not_shown(self, client, world):
        response = client.get(admin_url(Job, "change", world.other_job.pk))

        # Django's answer for an object outside the queryset: back to the index with a message.
        assert response.status_code == 302
        assert "ROLE-002" not in body(response)
        posted = client.post(admin_url(Job, "change", world.other_job.pk), {"status": "completed", "_save": "Save"})
        assert posted.status_code == 302
        world.other_job.refresh_from_db()
        assert world.other_job.status == "pending"

    def test_own_job_form_has_only_status_and_no_contract(self, client, world):
        response = client.get(admin_url(Job, "change", world.own_job.pk))
        adminform = response.context["adminform"]

        assert response.status_code == 200
        assert list(adminform.form.fields) == ["status"]
        assert [value for value, _ in adminform.form.fields["status"].choices] == ["pending", "in_progress", "completed"]
        shown = flatten_fieldsets(adminform.fieldsets)
        assert "contract" not in shown and "contract" not in adminform.readonly_fields
        assert set(shown) - {"status"} <= set(adminform.readonly_fields)
        assert_no_leak(response)
        assert "Install the Vodacom skin" in body(response)  # their own job's details are there to read

    def test_saving_changes_only_the_status(self, client, world):
        job = world.own_job
        before = Job.objects.filter(pk=job.pk).values().get()

        response = client.post(admin_url(Job, "change", job.pk), {
            "status": "in_progress", "priority": "high", "description": "rewritten", "contract": "",
            "assigned_to": world.colleague.pk, "billboard": world.other_billboard.pk, "scheduled_date": "2030-01-01",
            "actual_hours": "9.5", "_save": "Save",
        })

        assert response.status_code == 302
        after = Job.objects.filter(pk=job.pk).values().get()
        assert after["status"] == "in_progress"
        ignore = {"status", "updated_at"}
        assert {k: v for k, v in after.items() if k not in ignore} == {k: v for k, v in before.items() if k not in ignore}

    def test_a_crafted_cancel_is_rejected(self, client, world):
        response = client.post(admin_url(Job, "change", world.own_job.pk), {"status": "cancelled", "_save": "Save"})

        assert response.status_code == 200
        assert "status" in response.context["adminform"].form.errors
        world.own_job.refresh_from_db()
        assert world.own_job.status == "pending"

    def test_a_cancelled_job_is_read_only(self, client, world):
        Job.objects.filter(pk=world.own_job.pk).update(status=Job.Status.CANCELLED)

        response = client.get(admin_url(Job, "change", world.own_job.pk))
        assert response.status_code == 200
        assert list(response.context["adminform"].form.fields) == []
        assert "status" in response.context["adminform"].readonly_fields

        client.post(admin_url(Job, "change", world.own_job.pk), {"status": "pending", "_save": "Save"})
        world.own_job.refresh_from_db()
        assert world.own_job.status == "cancelled"


# --------------------------------------------------------------------- jobs: admin, sales, design


@pytest.mark.django_db
class TestJobsAdmin:
    def test_api_admin_does_everything(self, admin_user, operations_user, world):
        client = api(admin_user)

        created = client.post("/api/jobs/", job_payload(world, contract=world.contract.id, assigned_to=operations_user.id), format="json")
        assert created.status_code == 201
        job_id = created.json()["id"]
        assert created.json()["contract"] == world.contract.id and created.json()["assigned_to"] == operations_user.id

        patched = client.patch(f"/api/jobs/{job_id}/", {
            "priority": "high", "status": "cancelled", "assigned_to": world.colleague.id, "contract": None, "description": "Changed",
        }, format="json")
        assert patched.status_code == 200
        job = Job.objects.get(pk=job_id)
        assert (job.priority, job.status, job.assigned_to, job.contract, job.description) == ("high", "cancelled", world.colleague, None, "Changed")

        assert client.put(f"/api/jobs/{job_id}/", job_payload(world, status="pending"), format="json").status_code == 200
        assert len(client.get("/api/jobs/").json()) == 3
        assert client.delete(f"/api/jobs/{job_id}/").status_code == 204

    def test_admin_pages_admin_role_does_everything(self, admin_user, world):
        client = web(admin_user)

        assert list(client.get(admin_url(Job, "changelist")).context["cl"].result_list) == [world.own_job, world.other_job]
        form = client.get(admin_url(Job, "change", world.own_job.pk)).context["adminform"].form
        assert {"contract", "assigned_to", "status", "billboard"} <= set(form.fields)
        assert [value for value, _ in form.fields["status"].choices] == ["pending", "in_progress", "completed", "cancelled"]
        assert client.get(admin_url(Job, "add")).status_code == 200
        assert client.post(admin_url(Job, "delete", world.other_job.pk), {"post": "yes"}).status_code == 302
        assert Job.objects.count() == 1

    def test_superuser_keeps_full_admin_access_whatever_the_role(self, superuser, world):
        client = web(superuser)  # role: design

        assert len(client.get(admin_url(Job, "changelist")).context["cl"].result_list) == 2
        response = client.get(admin_url(Job, "change", world.own_job.pk))
        assert "contract" in response.context["adminform"].form.fields
        assert client.get(admin_url(Job, "add")).status_code == 200
        assert client.get(admin_url(Client, "changelist")).status_code == 200


@pytest.mark.django_db
class TestJobsSalesAndDesign:
    @pytest.mark.parametrize("role, sees_contract", [("sales", True), ("design", False)])
    def test_api_is_read_only(self, role, sees_contract, users, world):
        client = api(users[role])

        listed = client.get("/api/jobs/")
        assert listed.status_code == 200
        assert [job["id"] for job in listed.json()] == [world.own_job.id, world.other_job.id]
        assert all(("contract" in job) is sees_contract for job in listed.json())
        assert ("contract" in client.get(f"/api/jobs/{world.own_job.id}/").json()) is sees_contract
        assert_no_leak(listed)

        assert client.post("/api/jobs/", job_payload(world), format="json").status_code == 403
        assert client.put(f"/api/jobs/{world.own_job.id}/", job_payload(world), format="json").status_code == 403
        assert client.patch(f"/api/jobs/{world.own_job.id}/", {"status": "completed"}, format="json").status_code == 403
        assert client.delete(f"/api/jobs/{world.own_job.id}/").status_code == 403
        world.own_job.refresh_from_db()
        assert Job.objects.count() == 2 and world.own_job.status == "pending"

    @pytest.mark.parametrize("role, sees_contract", [("sales", True), ("design", False)])
    def test_admin_pages_are_read_only(self, role, sees_contract, users, world):
        client = web(users[role])

        listing = client.get(admin_url(Job, "changelist"))
        assert listing.status_code == 200
        assert len(listing.context["cl"].result_list) == 2
        assert CLIENT_NAME not in body(listing)

        response = client.get(admin_url(Job, "change", world.own_job.pk))
        adminform = response.context["adminform"]
        assert response.status_code == 200
        assert list(adminform.form.fields) == []
        assert ("contract" in flatten_fieldsets(adminform.fieldsets)) is sees_contract
        assert (CLIENT_NAME in body(response)) is sees_contract

        assert client.get(admin_url(Job, "add")).status_code == 403
        assert client.post(admin_url(Job, "change", world.own_job.pk), {"status": "completed", "_save": "Save"}).status_code == 403
        assert client.post(admin_url(Job, "delete", world.own_job.pk), {"post": "yes"}).status_code == 403
        world.own_job.refresh_from_db()
        assert world.own_job.status == "pending"

    def test_superuser_gets_no_bypass_on_the_jobs_api(self, superuser, world):
        client = api(superuser)  # role: design

        assert client.post("/api/jobs/", job_payload(world), format="json").status_code == 403
        assert client.patch(f"/api/jobs/{world.own_job.id}/", {"status": "completed"}, format="json").status_code == 403
        assert "contract" not in client.get(f"/api/jobs/{world.own_job.id}/").json()


@pytest.mark.django_db
class TestKpis:
    @pytest.mark.parametrize("role, status", [("admin", 200), ("sales", 200), ("design", 200), ("operations", 403)])
    def test_by_role(self, role, status, users, world):
        response = api(users[role]).get("/api/jobs/kpis/")

        assert response.status_code == status
        assert_no_leak(response)


# --------------------------------------------------------------------- dashboard and sidebar


SALES_LABELS = ("Active Contracts", "New Inquiries", "Recent Inquiries")
SALES_CONTEXT = ("active_contracts", "new_inquiries", "recent_inquiries")


@pytest.mark.django_db
class TestDashboard:
    @pytest.mark.parametrize("who", ["admin", "sales", "superuser"])
    def test_sales_figures_for_those_allowed(self, who, users, superuser, world):
        response = web({**users, "superuser": superuser}[who]).get("/admin/")
        html = body(response)

        assert response.status_code == 200
        assert all(label in html for label in SALES_LABELS)
        assert INQUIRER in html
        assert response.context["show_sales_data"] is True
        assert response.context["active_contracts"] == 1 and response.context["new_inquiries"] == 1

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_nothing_for_design_and_operations(self, role, users, world):
        response = web(users[role]).get("/admin/")
        html = body(response)

        assert response.status_code == 200
        for text in (*SALES_LABELS, "No inquiries yet", *LEAKS):
            assert text not in html
        assert response.context["show_sales_data"] is False
        assert not any(key in response.context for key in SALES_CONTEXT)
        # The job and billboard cards are still there.
        assert "Jobs This Week" in html and "Available Billboards" in html

    @pytest.mark.parametrize("role", ["operations", "design"])
    def test_no_empty_inquiries_message_either(self, role, users, world):
        Inquiry.objects.all().delete()

        assert "No inquiries yet" not in body(web(users[role]).get("/admin/"))
        assert "No inquiries yet" in body(web(users["sales"]).get("/admin/"))


def sidebar(html):
    """{group heading: [link titles]} as Unfold drew the sidebar, and each group's wrapper classes."""
    links, wrappers = {}, {}
    for wrapper, heading, items in re.findall(r'<div class="([^"]*)"\s*>\s*<hr[^>]*>\s*<h2[^>]*>\s*(.*?)\s*</h2>\s*<ol[^>]*>(.*?)</ol>', html, re.S):
        heading = heading.replace("&amp;", "&")
        hrefs = re.findall(r'<a[^>]*href="([^"]+)"', items)
        links[heading] = [title for title, href in SIDEBAR.items() if href in hrefs]
        wrappers[heading] = wrapper
    return links, wrappers


EXPECTED_SIDEBAR = {
    "admin": {
        "Sales & Bookings": ["Billboards", "Clients", "Contracts", "Inquiries"], "Operations": ["Jobs"],
        "Marketing": ["Blog Posts", "Site Images", "Case Studies"], "Administration": ["Staff Accounts"],
    },
    "sales": {
        "Sales & Bookings": ["Billboards", "Clients", "Contracts", "Inquiries"], "Operations": ["Jobs"],
        "Marketing": [], "Administration": [],
    },
    "operations": {"Sales & Bookings": ["Billboards"], "Operations": ["Jobs"], "Marketing": [], "Administration": []},
    "design": {
        "Sales & Bookings": ["Billboards"], "Operations": ["Jobs"],
        "Marketing": ["Blog Posts", "Site Images", "Case Studies"], "Administration": [],
    },
}


@pytest.mark.django_db
class TestSidebar:
    @pytest.mark.parametrize("role", ["admin", "sales", "operations", "design"])
    def test_links_by_role(self, role, users, world):
        links, wrappers = sidebar(body(web(users[role]).get("/admin/")))

        assert {group: links[group] for group in EXPECTED_SIDEBAR[role]} == EXPECTED_SIDEBAR[role]
        # A group with nothing in it is still in the markup, but Unfold's own
        # classes hide it unless its list has an item: no heading left on its own.
        for group, items in links.items():
            assert "hidden" in wrappers[group].split() and "has-[ol]:has-[li]:block" in wrappers[group].split()
        assert all(group in links for group in GROUPS[1:])

    def test_every_link_a_role_is_shown_opens(self, users, world):
        for role, user in users.items():
            client = web(user)
            links, _ = sidebar(body(client.get("/admin/")))
            for title in (title for titles in links.values() for title in titles):
                assert client.get(SIDEBAR[title]).status_code == 200, f"{role}: {title} is in the sidebar but does not open"
