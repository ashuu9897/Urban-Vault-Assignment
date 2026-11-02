"""Read-side query builders. Every queryset the API serves is built here."""

from django.db.models import Prefetch, QuerySet

from .choices import Role
from .models import IssueCategory, Ticket, TicketActivity, User

# Everything the list serializer touches, fetched in the same query (no N+1).
TICKET_LIST_RELATIONS = ("department", "organization", "created_by", "poc", "technician")


def helpdesk_users() -> QuerySet[User]:
    """Users that take part in the helpdesk (admin-only accounts have no role)."""
    return (
        User.objects.filter(is_active=True)
        .exclude(role="")
        .select_related("department", "organization")
        .order_by("role", "id")  # grouped by role, in seed order
    )


def issue_categories() -> QuerySet[IssueCategory]:
    return IssueCategory.objects.select_related("department").order_by("display_order", "name")


def visible_tickets_for(user: User) -> QuerySet[Ticket]:
    """
    Tickets `user` may see. Mirrors `permissions.can_view`; keep the two in sync.

    Anything outside this queryset is reported as 404 by the API, so ticket ids belonging
    to other clients or departments are not even confirmed to exist.
    """
    tickets = Ticket.objects.select_related(*TICKET_LIST_RELATIONS)
    if user.role == Role.CLIENT:
        return tickets.filter(created_by=user)
    if user.role == Role.POC:
        return tickets.filter(department_id=user.department_id)
    if user.role == Role.TECHNICIAN:
        return tickets.filter(technician=user)
    return tickets.none()


def ticket_detail_queryset(user: User) -> QuerySet[Ticket]:
    activities = TicketActivity.objects.select_related("actor", "to_user")
    return visible_tickets_for(user).prefetch_related(Prefetch("activities", queryset=activities))


def assignable_technicians(ticket: Ticket) -> QuerySet[User]:
    return helpdesk_users().filter(role=Role.TECHNICIAN, department_id=ticket.department_id)
