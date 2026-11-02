from datetime import timedelta

import pytest
from django.utils import timezone

from helpdesk import services
from helpdesk.choices import TicketStatus
from helpdesk.models import Ticket

from .factories import IssueCategoryFactory

pytestmark = pytest.mark.django_db

TICKETS_URL = "/api/tickets/"


def detail_url(ticket: Ticket, suffix: str = "") -> str:
    return f"{TICKETS_URL}{ticket.pk}/{suffix}"


class TestDemoAuthentication:
    def test_missing_header_is_401_with_standard_error_shape(self, api):
        response = api().get(TICKETS_URL)

        assert response.status_code == 401
        assert response.json() == {
            "detail": "Authentication credentials were not provided.",
            "errors": {},
        }

    @pytest.mark.parametrize("header", ["abc", "999999"])
    def test_invalid_or_unknown_user_is_401(self, api, header):
        client = api()
        client.credentials(HTTP_X_USER_ID=header)
        assert client.get(TICKETS_URL).status_code == 401

    def test_user_list_is_public_for_the_demo_selector(self, api, client_user, poc):
        response = api().get("/api/users/")

        assert response.status_code == 200
        assert {u["id"] for u in response.json()} == {client_user.id, poc.id}

    def test_me_returns_the_acting_user(self, api, client_user):
        body = api(client_user).get("/api/me/").json()

        assert body["name"] == "Chaitanya M"
        assert body["role"] == "client"
        assert body["organization"]["site_label"] == client_user.organization.site_label


class TestCreateTicketEndpoint:
    def test_creates_ticket_auto_assigned_to_poc(self, api, client_user, poc, ac_category):
        response = api(client_user).post(
            TICKETS_URL, {"category_id": ac_category.id, "description": "Warm air"}, format="json"
        )

        assert response.status_code == 201
        body = response.json()
        assert body["status"] == TicketStatus.PENDING_ASSIGNMENT
        assert body["code"].startswith("TKT-")
        assert [a["id"] for a in body["assignees"]] == [poc.id]
        assert [a["type"] for a in body["activities"]] == ["created", "auto_assigned"]
        assert body["available_actions"] == ["resolve"]
        assert body["action_required"] is False

    def test_missing_issue_is_a_field_error(self, api, client_user):
        response = api(client_user).post(TICKETS_URL, {}, format="json")

        assert response.status_code == 400
        assert response.json() == {
            "detail": "Please select an issue.",
            "errors": {"category_id": ["Please select an issue."]},
        }

    def test_description_longer_than_1000_chars_is_rejected(self, api, client_user, ac_category):
        response = api(client_user).post(
            TICKETS_URL, {"category_id": ac_category.id, "description": "x" * 1001}, format="json"
        )

        assert response.status_code == 400
        assert "description" in response.json()["errors"]

    def test_duplicate_open_ticket_within_24h_is_a_non_field_error(
        self, api, client_user, ticket, ac_category
    ):
        response = api(client_user).post(
            TICKETS_URL, {"category_id": ac_category.id}, format="json"
        )

        assert response.status_code == 400
        errors = response.json()["errors"]
        assert list(errors) == ["non_field_errors"]
        assert ticket.code in errors["non_field_errors"][0]

    def test_non_clients_get_403(self, api, poc, ac_category):
        response = api(poc).post(TICKETS_URL, {"category_id": ac_category.id}, format="json")
        assert response.status_code == 403


class TestAssignEndpoint:
    def test_non_poc_gets_403(self, api, ticket, client_user, technician):
        response = api(client_user).post(
            detail_url(ticket, "assign/"), {"technician_id": technician.id}, format="json"
        )
        assert response.status_code == 403

    def test_technician_from_another_department_is_400(self, api, ticket, poc, it_technician):
        response = api(poc).post(
            detail_url(ticket, "assign/"), {"technician_id": it_technician.id}, format="json"
        )

        assert response.status_code == 400
        assert "technician_id" in response.json()["errors"]

    def test_missing_technician_is_400(self, api, ticket, poc):
        response = api(poc).post(detail_url(ticket, "assign/"), {}, format="json")

        assert response.status_code == 400
        assert response.json()["errors"]["technician_id"] == ["Please select a technician."]

    def test_valid_assignment(self, api, ticket, poc, technician):
        response = api(poc).post(
            detail_url(ticket, "assign/"), {"technician_id": technician.id}, format="json"
        )

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == TicketStatus.PENDING_RESOLUTION
        assert [a["id"] for a in body["assignees"]] == [poc.id, technician.id]
        assert body["activities"][-1]["type"] == "assigned"
        assert body["activities"][-1]["to_user"]["id"] == technician.id
        assert body["available_actions"] == []
        # ...and the ticket now shows up in the technician's list.
        technician_list = api(technician).get(TICKETS_URL).json()
        assert [t["id"] for t in technician_list["results"]] == [ticket.id]

    def test_assignable_technicians_lists_only_the_tickets_department(
        self, api, ticket, poc, technician, other_technician, it_technician
    ):
        response = api(poc).get(detail_url(ticket, "assignable-technicians/"))

        assert response.status_code == 200
        assert {t["id"] for t in response.json()} == {technician.id, other_technician.id}

    def test_assignable_technicians_is_poc_only(self, api, ticket, client_user):
        response = api(client_user).get(detail_url(ticket, "assignable-technicians/"))
        assert response.status_code == 403


class TestResolveEndpoint:
    def test_technician_without_comment_is_400(self, api, assigned_ticket, technician):
        response = api(technician).post(detail_url(assigned_ticket, "resolve/"), {}, format="json")

        assert response.status_code == 400
        assert "comment" in response.json()["errors"]

    def test_technician_with_comment_resolves(self, api, assigned_ticket, technician):
        response = api(technician).post(
            detail_url(assigned_ticket, "resolve/"),
            {"comment": "Recharged the refrigerant."},
            format="json",
        )

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == TicketStatus.RESOLVED
        assert body["resolved_at"] is not None
        last = body["activities"][-1]
        assert (last["type"], last["from_value"], last["to_value"]) == (
            "status_changed",
            "Open",
            "Resolved",
        )
        assert last["text"] == "Recharged the refrigerant."

    def test_already_resolved_is_400(self, api, ticket, client_user):
        services.resolve_ticket(ticket=ticket, actor=client_user)

        response = api(client_user).post(detail_url(ticket, "resolve/"), {}, format="json")

        assert response.status_code == 400
        assert response.json()["detail"] == "This ticket is already resolved."


class TestCommentsEndpoint:
    def test_creates_comment_activity(self, api, ticket, poc):
        response = api(poc).post(detail_url(ticket, "comments/"), {"text": "Looking into it"})

        assert response.status_code == 201
        body = response.json()
        assert (body["type"], body["text"], body["actor"]["id"]) == (
            "comment",
            "Looking into it",
            poc.id,
        )

    @pytest.mark.parametrize("text", ["", "   ", "x" * 501])
    def test_invalid_text_is_400(self, api, ticket, client_user, text):
        response = api(client_user).post(detail_url(ticket, "comments/"), {"text": text})

        assert response.status_code == 400
        assert "text" in response.json()["errors"]


class TestVisibility:
    def test_unassigned_technician_gets_404(self, api, ticket, technician):
        """Tickets outside your visibility are reported as not found, never as forbidden."""
        assert api(technician).get(detail_url(ticket)).status_code == 404

    def test_other_client_and_other_department_get_404(self, api, ticket, other_client, it_poc):
        assert api(other_client).get(detail_url(ticket)).status_code == 404
        assert api(it_poc).get(detail_url(ticket)).status_code == 404
        response = api(other_client).post(detail_url(ticket, "comments/"), {"text": "hi"})
        assert response.status_code == 404

    def test_poc_sees_all_department_tickets_and_detail(self, api, ticket, poc):
        response = api(poc).get(detail_url(ticket))

        assert response.status_code == 200
        body = response.json()
        assert body["description"] == "Warm air on 2F."
        assert body["available_actions"] == ["assign"]
        assert body["action_required"] is True


class TestListEndpoint:
    @pytest.fixture
    def history(self, client_user, poc, technician, hvac):
        """15 tickets for one client, one per hour going back in time; 3 are resolved."""
        categories = [IssueCategoryFactory(department=hvac) for _ in range(15)]
        now = timezone.now()
        tickets = [
            services.create_ticket(
                client=client_user, category=category, at=now - timedelta(hours=index)
            )
            for index, category in enumerate(categories)
        ]
        for ticket in tickets[:3]:
            services.resolve_ticket(ticket=ticket, actor=client_user)
        services.assign_technician(ticket=tickets[3], actor=poc, technician_id=technician.id)
        return tickets

    def test_pagination_shape_and_page_size(self, api, client_user, history):
        client = api(client_user)

        first = client.get(TICKETS_URL, {"tab": "open", "page_size": 5}).json()
        last = client.get(TICKETS_URL, {"tab": "open", "page_size": 5, "page": 3}).json()

        assert first["count"] == 12
        assert len(first["results"]) == 5
        assert first["previous"] is None
        assert "page=2" in first["next"]
        assert len(last["results"]) == 2
        assert last["next"] is None

    def test_default_page_size_is_10(self, api, client_user, history):
        body = api(client_user).get(TICKETS_URL).json()
        assert (body["count"], len(body["results"])) == (15, 10)

    def test_out_of_range_page_is_404(self, api, client_user, history):
        assert api(client_user).get(TICKETS_URL, {"page": 99}).status_code == 404

    def test_list_rows_are_lean(self, api, client_user, history):
        row = api(client_user).get(TICKETS_URL).json()["results"][0]
        assert "description" not in row
        assert "activities" not in row
        assert {"available_actions", "action_required", "assignees"} <= row.keys()

    def test_tabs_split_open_and_resolved(self, api, client_user, history):
        client = api(client_user)
        resolved = client.get(TICKETS_URL, {"tab": "resolved"}).json()
        open_ = client.get(TICKETS_URL, {"tab": "open", "page_size": 50}).json()

        assert resolved["count"] == 3
        assert {t["status"] for t in resolved["results"]} == {"resolved"}
        assert "resolved" not in {t["status"] for t in open_["results"]}

    def test_status_filter(self, api, client_user, history):
        body = api(client_user).get(TICKETS_URL, {"status": "pending_resolution"}).json()

        assert body["count"] == 1
        assert body["results"][0]["id"] == history[3].id

    def test_invalid_filter_value_is_400(self, api, client_user):
        response = api(client_user).get(TICKETS_URL, {"status": "bogus"})

        assert response.status_code == 400
        assert "status" in response.json()["errors"]

    def test_search_matches_issue_text_or_code(self, api, client_user, history):
        client = api(client_user)
        target = history[7]

        by_title = client.get(TICKETS_URL, {"search": target.title.upper()}).json()
        by_code = client.get(TICKETS_URL, {"search": f"#{target.code}"}).json()

        assert [t["id"] for t in by_title["results"]] == [target.id]
        assert [t["id"] for t in by_code["results"]] == [target.id]

    def test_ordering_by_created_time(self, api, client_user, history):
        client = api(client_user)
        newest = client.get(TICKETS_URL, {"page_size": 50}).json()["results"]
        oldest = client.get(TICKETS_URL, {"ordering": "created_at", "page_size": 50}).json()

        assert [t["id"] for t in newest] == [t.id for t in history]
        assert [t["id"] for t in oldest["results"]] == [t.id for t in reversed(history)]

    def test_list_uses_a_constant_number_of_queries(
        self, api, client_user, history, django_assert_max_num_queries
    ):
        """1 auth lookup + 1 COUNT + 1 page SELECT (with joins), regardless of page size."""
        client = api(client_user)
        with django_assert_max_num_queries(3):
            client.get(TICKETS_URL, {"page_size": 2})
        with django_assert_max_num_queries(3):
            client.get(TICKETS_URL, {"page_size": 15})

    def test_detail_uses_a_constant_number_of_queries(
        self, api, assigned_ticket, poc, client_user, django_assert_max_num_queries
    ):
        for _ in range(5):
            services.add_comment(ticket=assigned_ticket, actor=client_user, text="Ping")
        # 1 auth lookup + 1 ticket SELECT (with joins) + 1 activities prefetch (with joins).
        with django_assert_max_num_queries(3):
            api(poc).get(detail_url(assigned_ticket))
