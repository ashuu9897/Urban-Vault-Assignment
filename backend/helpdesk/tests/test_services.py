from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError
from django.utils import timezone

from helpdesk import permissions, services
from helpdesk.choices import ActivityType, TicketStatus
from helpdesk.models import Ticket
from helpdesk.selectors import visible_tickets_for

from .factories import ClientFactory, IssueCategoryFactory, PocFactory

pytestmark = pytest.mark.django_db


class TestCreateTicket:
    def test_routes_to_department_poc_and_records_history(self, ticket, client_user, poc):
        assert ticket.code == f"TKT-{1000 + ticket.pk}"
        assert ticket.status == TicketStatus.PENDING_ASSIGNMENT
        assert ticket.poc == poc
        assert ticket.organization == client_user.organization
        assert ticket.title == ticket.category.name

        created, auto_assigned = ticket.activities.all()
        assert (created.type, created.actor) == (ActivityType.CREATED, client_user)
        assert auto_assigned.type == ActivityType.AUTO_ASSIGNED
        assert auto_assigned.actor is None  # System
        assert (auto_assigned.from_value, auto_assigned.to_user) == ("Unassigned", poc)

    def test_only_clients_can_create(self, poc, ac_category):
        with pytest.raises(PermissionDenied):
            services.create_ticket(client=poc, category=ac_category)

    def test_fails_clearly_when_department_has_no_poc(self, client_user):
        orphan_category = IssueCategoryFactory()
        with pytest.raises(ValidationError, match="No POC is configured"):
            services.create_ticket(client=client_user, category=orphan_category)

    def test_duplicate_open_ticket_within_24h_is_rejected(self, ticket, client_user, ac_category):
        with pytest.raises(ValidationError, match=ticket.code):
            services.create_ticket(client=client_user, category=ac_category)

    def test_duplicate_rule_ignores_old_resolved_and_other_clients_tickets(
        self, client_user, other_client, ac_category, poc
    ):
        services.create_ticket(
            client=client_user, category=ac_category, at=timezone.now() - timedelta(hours=25)
        )
        services.create_ticket(client=other_client, category=ac_category)
        fresh = services.create_ticket(client=client_user, category=ac_category)
        services.resolve_ticket(ticket=fresh, actor=client_user)

        services.create_ticket(client=client_user, category=ac_category)

        assert Ticket.objects.filter(created_by=client_user).count() == 3


class TestAssignTechnician:
    def test_moves_ticket_to_pending_resolution(self, assigned_ticket, poc, technician):
        assert assigned_ticket.status == TicketStatus.PENDING_RESOLUTION
        assert assigned_ticket.technician == technician
        activity = assigned_ticket.activities.last()
        assert (activity.type, activity.actor, activity.to_user) == (
            ActivityType.ASSIGNED,
            poc,
            technician,
        )

    def test_only_the_tickets_poc_may_assign(self, ticket, it_poc, technician):
        with pytest.raises(PermissionDenied):
            services.assign_technician(ticket=ticket, actor=it_poc, technician_id=technician.id)

    def test_technician_must_belong_to_the_tickets_department(self, ticket, poc, it_technician):
        with pytest.raises(ValidationError) as excinfo:
            services.assign_technician(ticket=ticket, actor=poc, technician_id=it_technician.id)
        assert "technician_id" in excinfo.value.message_dict

    def test_cannot_reassign(self, assigned_ticket, poc, other_technician):
        with pytest.raises(ValidationError, match="already has a technician"):
            services.assign_technician(
                ticket=assigned_ticket, actor=poc, technician_id=other_technician.id
            )


class TestResolveTicket:
    def test_client_may_resolve_before_assignment_without_comment(self, ticket, client_user):
        resolved = services.resolve_ticket(ticket=ticket, actor=client_user)

        assert resolved.status == TicketStatus.RESOLVED
        assert resolved.resolved_by == client_user
        assert resolved.resolved_at is not None
        activity = resolved.activities.last()
        assert (activity.from_value, activity.to_value, activity.text) == ("Open", "Resolved", "")

    @pytest.mark.parametrize("comment", ["", "   ", "ok"])
    def test_technician_must_explain_the_fix(self, assigned_ticket, technician, comment):
        with pytest.raises(ValidationError) as excinfo:
            services.resolve_ticket(ticket=assigned_ticket, actor=technician, comment=comment)
        assert "comment" in excinfo.value.message_dict

    def test_technician_resolves_with_comment(self, assigned_ticket, technician):
        resolved = services.resolve_ticket(
            ticket=assigned_ticket, actor=technician, comment="  Replaced the filter.  "
        )
        assert resolved.status == TicketStatus.RESOLVED
        assert resolved.activities.last().text == "Replaced the filter."

    def test_poc_cannot_resolve(self, assigned_ticket, poc):
        with pytest.raises(PermissionDenied):
            services.resolve_ticket(ticket=assigned_ticket, actor=poc, comment="Done here.")

    def test_resolving_twice_is_a_validation_error(self, ticket, client_user):
        services.resolve_ticket(ticket=ticket, actor=client_user)
        with pytest.raises(ValidationError, match="already resolved"):
            services.resolve_ticket(ticket=ticket, actor=client_user)


class TestAddComment:
    def test_anyone_who_can_see_the_ticket_may_comment(self, ticket, client_user, poc):
        for author in (client_user, poc):
            activity = services.add_comment(ticket=ticket, actor=author, text=" Any update? ")
            assert (activity.type, activity.text) == (ActivityType.COMMENT, "Any update?")

    def test_outsiders_cannot_comment(self, ticket, other_client, it_poc, technician):
        for outsider in (other_client, it_poc, technician):  # technician not yet assigned
            with pytest.raises(PermissionDenied):
                services.add_comment(ticket=ticket, actor=outsider, text="Hello")

    def test_blank_comment_is_rejected(self, ticket, client_user):
        with pytest.raises(ValidationError):
            services.add_comment(ticket=ticket, actor=client_user, text="   ")


class TestPermissions:
    def test_available_actions_per_role_and_state(
        self, ticket, client_user, poc, technician, other_technician
    ):
        assert permissions.available_actions(client_user, ticket) == ["resolve"]
        assert permissions.available_actions(poc, ticket) == ["assign"]

        services.assign_technician(ticket=ticket, actor=poc, technician_id=technician.id)
        ticket.refresh_from_db()
        assert permissions.available_actions(poc, ticket) == []
        assert permissions.available_actions(technician, ticket) == ["resolve"]
        assert permissions.available_actions(other_technician, ticket) == []

        services.resolve_ticket(ticket=ticket, actor=technician, comment="All fixed.")
        ticket.refresh_from_db()
        for user in (client_user, poc, technician):
            assert permissions.available_actions(user, ticket) == []

    def test_action_required_is_never_shown_to_clients(self, ticket, client_user, poc):
        assert permissions.is_action_required(client_user, ticket) is False
        assert permissions.is_action_required(poc, ticket) is True

    def test_can_view_matches_visible_tickets_queryset(
        self, assigned_ticket, client_user, other_client, poc, it_poc, technician, it_technician
    ):
        """The Python rule and the SQL rule must never disagree."""
        for user in (client_user, other_client, poc, it_poc, technician, it_technician):
            in_queryset = visible_tickets_for(user).filter(pk=assigned_ticket.pk).exists()
            assert permissions.can_view(user, assigned_ticket) is in_queryset, user


class TestDatabaseConstraints:
    def test_only_one_poc_per_department(self, poc):
        with pytest.raises(IntegrityError):
            PocFactory(department=poc.department)

    def test_resolved_ticket_needs_resolved_at(self, ticket):
        with pytest.raises(IntegrityError):
            Ticket.objects.filter(pk=ticket.pk).update(status=TicketStatus.RESOLVED)

    def test_client_without_organization_fails_model_validation(self):
        client = ClientFactory.build(organization=None)
        with pytest.raises(ValidationError) as excinfo:
            client.clean()
        assert "organization" in excinfo.value.message_dict
