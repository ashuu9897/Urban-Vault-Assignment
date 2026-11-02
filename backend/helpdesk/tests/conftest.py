"""
Shared fixtures: two departments (HVAC + IT), each with a POC and technicians, and two
clients. Tickets are always created through the service layer, never by factories, so
tests exercise the same code path as the API.
"""

from collections.abc import Callable

import pytest
from rest_framework.test import APIClient

from helpdesk import services
from helpdesk.models import Department, IssueCategory, Ticket, User

from .factories import (
    ClientFactory,
    DepartmentFactory,
    IssueCategoryFactory,
    PocFactory,
    TechnicianFactory,
)


@pytest.fixture
def hvac() -> Department:
    return DepartmentFactory(name="Technical (HVAC)")


@pytest.fixture
def it_dept() -> Department:
    return DepartmentFactory(name="IT & Network")


@pytest.fixture
def poc(hvac: Department) -> User:
    return PocFactory(department=hvac, first_name="Dhananjaya", last_name="Murthy")


@pytest.fixture
def it_poc(it_dept: Department) -> User:
    return PocFactory(department=it_dept)


@pytest.fixture
def technician(hvac: Department) -> User:
    return TechnicianFactory(department=hvac, first_name="Prakash", last_name="Kumar")


@pytest.fixture
def other_technician(hvac: Department) -> User:
    return TechnicianFactory(department=hvac)


@pytest.fixture
def it_technician(it_dept: Department) -> User:
    return TechnicianFactory(department=it_dept)


@pytest.fixture
def client_user() -> User:
    return ClientFactory(first_name="Chaitanya", last_name="M")


@pytest.fixture
def other_client() -> User:
    return ClientFactory()


@pytest.fixture
def ac_category(hvac: Department) -> IssueCategory:
    return IssueCategoryFactory(name="AC not cooling", department=hvac, is_quick_issue=True)


@pytest.fixture
def wifi_category(it_dept: Department) -> IssueCategory:
    return IssueCategoryFactory(name="Wi-Fi slow", department=it_dept)


@pytest.fixture
def ticket(client_user: User, ac_category: IssueCategory, poc: User) -> Ticket:
    """A freshly raised HVAC ticket, pending technician assignment."""
    return services.create_ticket(
        client=client_user, category=ac_category, description="Warm air on 2F."
    )


@pytest.fixture
def assigned_ticket(ticket: Ticket, poc: User, technician: User) -> Ticket:
    return services.assign_technician(ticket=ticket, actor=poc, technician_id=technician.id)


@pytest.fixture
def api() -> Callable[[User | None], APIClient]:
    """`api(user)` returns a client that acts as `user` via the demo X-User-Id header."""

    def make(user: User | None = None) -> APIClient:
        client = APIClient()
        if user is not None:
            client.credentials(HTTP_X_USER_ID=str(user.id))
        return client

    return make
