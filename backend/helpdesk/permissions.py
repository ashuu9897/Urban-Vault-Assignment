"""
Pure, query-free permission rules for a (user, ticket) pair.

These functions are the single source of truth for "who may do what". Services use them
to enforce rules and serializers use them to tell the frontend which actions to offer
(`available_actions`), so the UI can never drift from what the API will accept.
"""

from typing import Literal

from .choices import Role, TicketStatus
from .models import Ticket, User

TicketAction = Literal["assign", "resolve", "reopen"]


def can_view(user: User, ticket: Ticket) -> bool:
    """Python mirror of `selectors.visible_tickets_for`; keep the two in sync."""
    if user.role == Role.CLIENT:
        return ticket.created_by_id == user.id
    if user.role == Role.POC:
        return ticket.department_id == user.department_id
    if user.role == Role.TECHNICIAN:
        return ticket.technician_id == user.id
    return False


def can_create_ticket(user: User) -> bool:
    return user.role == Role.CLIENT


def is_ticket_poc(user: User, ticket: Ticket) -> bool:
    return user.role == Role.POC and ticket.poc_id == user.id


def can_assign(user: User, ticket: Ticket) -> bool:
    return is_ticket_poc(user, ticket) and ticket.status == TicketStatus.PENDING_ASSIGNMENT


def can_resolve(user: User, ticket: Ticket) -> bool:
    """The creator may resolve any open ticket; the technician only once it is theirs."""
    if user.role == Role.CLIENT:
        return ticket.created_by_id == user.id and ticket.is_open
    if user.role == Role.TECHNICIAN:
        return ticket.technician_id == user.id and ticket.status == TicketStatus.PENDING_RESOLUTION
    return False


def can_reopen(user: User, ticket: Ticket) -> bool:
    """A resolved ticket may be reopened by the client who raised it or the department POC."""
    if ticket.status != TicketStatus.RESOLVED:
        return False
    if user.role == Role.CLIENT:
        return ticket.created_by_id == user.id
    return is_ticket_poc(user, ticket)


def available_actions(user: User, ticket: Ticket) -> list[TicketAction]:
    actions: list[TicketAction] = []
    if can_assign(user, ticket):
        actions.append("assign")
    if can_resolve(user, ticket):
        actions.append("resolve")
    if can_reopen(user, ticket):
        actions.append("reopen")
    return actions


def is_action_required(user: User, ticket: Ticket) -> bool:
    """
    Staff are *expected* to act on assign/resolve. A client's resolve and anyone's reopen
    are optional, so they never flag a ticket as needing attention.
    """
    if user.role == Role.CLIENT:
        return False
    return can_assign(user, ticket) or can_resolve(user, ticket)
