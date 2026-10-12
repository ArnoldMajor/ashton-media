import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="admin_test", password="x", role="admin", is_staff=True, is_active=True)


@pytest.fixture
def sales_user(db):
    return User.objects.create_user(username="sales_test", password="x", role="sales", is_staff=True, is_active=True)


@pytest.fixture
def operations_user(db):
    return User.objects.create_user(username="ops_test", password="x", role="operations", is_staff=True, is_active=True)


@pytest.fixture
def design_user(db):
    return User.objects.create_user(username="design_test", password="x", role="design", is_staff=True, is_active=True)
