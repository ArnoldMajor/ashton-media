import re
from datetime import date
from html import escape

import pytest
from django.contrib.auth import get_user_model
from django.db.backends.postgresql.psycopg_any import DateRange
from django.urls import reverse

from billboards.models import Billboard
from blog.models import BlogPost
from clients.models import Client
from contracts.models import Contract
from inquiries.models import Inquiry
from jobs.models import Job

User = get_user_model()


@pytest.fixture
def admin_superuser(db):
    return User.objects.create_superuser(username="links_super_test", password="x", role="admin")


@pytest.fixture
def billboard(db):
    return Billboard.objects.create(
        site_code="LINK-001", name="Link Test Site", format=Billboard.Format.STATIC,
        status=Billboard.Status.AVAILABLE, region="Dar es Salaam", address="Test Rd",
        latitude=-6.8, longitude=39.28, width_meters=6, height_meters=3,
    )


@pytest.fixture
def client_obj(db):
    return Client.objects.create(company_name="Link Test Co", contact_name="Jane", email="jane@test.com")


@pytest.fixture
def contract(db, billboard, client_obj):
    return Contract.objects.create(
        billboard=billboard, client=client_obj,
        date_range=DateRange(date(2026, 9, 1), date(2026, 10, 1)),
    )


@pytest.fixture
def job(db, billboard):
    return Job.objects.create(
        billboard=billboard, job_type=Job.JobType.INSTALLATION, scheduled_date=date(2026, 9, 1),
    )


@pytest.fixture
def blog_post(db):
    return BlogPost.objects.create(title="Link Test Post", slug="link-test-post", content="Body")


@pytest.fixture
def inquiry(db):
    return Inquiry.objects.create(name="Link Test Person", email="person@test.com", message="Hello")


def assert_row_link(client, obj, text):
    """The changelist has an <a> to obj's change page wrapping `text`."""
    opts = obj._meta
    changelist = reverse(f"admin:{opts.app_label}_{opts.model_name}_changelist")
    change_url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])

    response = client.get(changelist)
    assert response.status_code == 200
    html = response.content.decode()

    anchors = re.findall(r'<a href="([^"]*)"[^>]*>(.*?)</a>', html, re.S)
    link_texts = [body.strip() for href, body in anchors if href.split("?")[0] == change_url]
    assert escape(str(text)) in link_texts, f"no link to {change_url} wrapping {text!r}; got {link_texts}"


@pytest.mark.django_db
class TestChangelistLinks:
    @pytest.fixture(autouse=True)
    def login(self, client, admin_superuser):
        client.force_login(admin_superuser)

    def test_billboard_links_on_name(self, client, billboard):
        assert_row_link(client, billboard, billboard.name)

    def test_billboard_site_code_is_not_a_link(self, client, billboard):
        html = client.get(reverse("admin:billboards_billboard_changelist")).content.decode()
        assert not re.search(r"<a [^>]*>\s*LINK-001\s*</a>", html)

    def test_client_links_on_company_name(self, client, client_obj):
        assert_row_link(client, client_obj, client_obj.company_name)

    def test_contract_links_on_billboard(self, client, contract):
        assert_row_link(client, contract, contract.billboard)

    def test_job_links_on_billboard(self, client, job):
        assert_row_link(client, job, job.billboard)

    def test_blog_post_links_on_title(self, client, blog_post):
        assert_row_link(client, blog_post, blog_post.title)

    def test_inquiry_links_on_name(self, client, inquiry):
        assert_row_link(client, inquiry, inquiry.name)

    def test_user_links_on_username(self, client, admin_superuser):
        assert_row_link(client, admin_superuser, admin_superuser.username)


@pytest.mark.django_db
class TestMessageDismissButton:
    def test_save_message_has_dismiss_button(self, client, admin_superuser, client_obj):
        client.force_login(admin_superuser)
        url = reverse("admin:clients_client_change", args=[client_obj.pk])

        response = client.post(url, {
            "company_name": "Link Test Co Renamed", "contact_name": "Jane",
            "email": "jane@test.com", "status": "prospect", "_save": "Save",
        }, follow=True)
        html = response.content.decode()

        assert response.status_code == 200
        assert "was changed successfully" in html
        assert html.count('aria-label="Dismiss message"') == 1
        assert "ashton-message--success" in html

    def test_no_dismiss_button_without_messages(self, client, admin_superuser):
        client.force_login(admin_superuser)
        html = client.get(reverse("admin:clients_client_changelist")).content.decode()
        assert 'aria-label="Dismiss message"' not in html
