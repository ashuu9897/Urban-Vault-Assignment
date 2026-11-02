"""
Write-side business logic. Every state change to a ticket goes through this module.

Services raise Django's own `ValidationError` (-> HTTP 400) and `PermissionDenied`
(-> HTTP 403) so they stay usable outside DRF (seed command, shell, admin actions); the
API's exception handler translates them into the standard error shape.

Each service accepts an optional `at` timestamp. The API never passes it; the seed command
uses it to replay realistic history through exactly the same code path.
"""

from datetime import datetime, timedelta

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from . import permissions
from .choices import (
    OPEN_LABEL,
    OPEN_STATUSES,
    RESOLVED_LABEL,
    UNASSIGNED_LABEL,
    ActivityType,
    Role,
    TicketStatus,
)
from .models import IssueCategory, Ticket, TicketActivity, User

DESCRIPTION_MAX_LENGTH = 1000
COMMENT_MAX_LENGTH = 500
RESOLUTION_COMMENT_MIN_LENGTH = 5
DUPLICATE_TICKET_WINDOW = timedelta(hours=24)


@transaction.atomic
def create_ticket(
    *,
    client: User,
    category: IssueCategory,
    description: str = "",
    at: datetime | None = None,
) -> Ticket:
    """Raise a ticket and route it to the POC of the category's department."""
    if not permissions.can_create_ticket(client):
        raise PermissionDenied("Only clients can create tickets.")
    now = at or timezone.now()

    # Lock the client's row so two simultaneous submissions can't both pass the
    # duplicate check below (no-op on SQLite, which serialises writes anyway).
    User.objects.select_for_update().only("pk").get(pk=client.pk)
    duplicate = (
        Ticket.objects.filter(
            created_by=client,
            category=category,
            status__in=OPEN_STATUSES,
            created_at__gte=now - DUPLICATE_TICKET_WINDOW,
        )
        .order_by("-created_at")
        .first()
    )
    if duplicate:
        raise ValidationError(
            f'You already raised an open "{category.name}" ticket in the last 24 hours '
            f"(#{duplicate.code}). Add a comment there instead."
        )

    poc = User.objects.filter(role=Role.POC, department_id=category.department_id).first()
    if poc is None:
        raise ValidationError(
            f"No POC is configured for the {category.department.name} department yet. "
            "Please contact the facility team."
        )

    ticket = Ticket.objects.create(
        category=category,
        title=category.name,
        description=description.strip(),
        department_id=category.department_id,
        organization_id=client.organization_id,
        created_by=client,
        poc=poc,
        status=TicketStatus.PENDING_ASSIGNMENT,
        created_at=now,
    )
    TicketActivity.objects.bulk_create(
        [
            TicketActivity(ticket=ticket, type=ActivityType.CREATED, actor=client, created_at=now),
            TicketActivity(
                ticket=ticket,
                type=ActivityType.AUTO_ASSIGNED,
                actor=None,
                from_value=UNASSIGNED_LABEL,
                to_user=poc,
                created_at=now,
            ),
        ]
    )
    return ticket


@transaction.atomic
def assign_technician(
    *,
    ticket: Ticket,
    actor: User,
    technician_id: int,
    at: datetime | None = None,
) -> Ticket:
    """Department POC hands a newly raised ticket to one of the department's technicians."""
    # Re-read under a row lock so two concurrent assignments can't both succeed.
    ticket = Ticket.objects.select_for_update().get(pk=ticket.pk)
    if not permissions.is_ticket_poc(actor, ticket):
        raise PermissionDenied("Only the department POC can assign a technician.")
    if ticket.status != TicketStatus.PENDING_ASSIGNMENT:
        raise ValidationError("This ticket already has a technician assigned.")

    technician = User.objects.filter(
        pk=technician_id, role=Role.TECHNICIAN, department_id=ticket.department_id
    ).first()
    if technician is None:
        raise ValidationError(
            {"technician_id": "Select a technician from this ticket's department."}
        )

    now = at or timezone.now()
    ticket.technician = technician
    ticket.status = TicketStatus.PENDING_RESOLUTION
    ticket.save(update_fields=["technician", "status", "updated_at"])
    TicketActivity.objects.create(
        ticket=ticket,
        type=ActivityType.ASSIGNED,
        actor=actor,
        from_value=UNASSIGNED_LABEL,
        to_user=technician,
        created_at=now,
    )
    return ticket


@transaction.atomic
def resolve_ticket(
    *,
    ticket: Ticket,
    actor: User,
    comment: str = "",
    at: datetime | None = None,
) -> Ticket:
    """
    Close a ticket. The client who raised it may do so at any time (comment optional);
    the assigned technician must explain what was done.
    """
    ticket = Ticket.objects.select_for_update().get(pk=ticket.pk)
    if ticket.status == TicketStatus.RESOLVED:
        raise ValidationError("This ticket is already resolved.")
    if not permissions.can_resolve(actor, ticket):
        raise PermissionDenied("You cannot resolve this ticket.")

    comment = comment.strip()
    if actor.role == Role.TECHNICIAN and len(comment) < RESOLUTION_COMMENT_MIN_LENGTH:
        raise ValidationError(
            {
                "comment": f"A resolution comment (min {RESOLUTION_COMMENT_MIN_LENGTH} "
                "characters) is required."
            }
        )

    now = at or timezone.now()
    ticket.status = TicketStatus.RESOLVED
    ticket.resolved_at = now
    ticket.resolved_by = actor
    ticket.save(update_fields=["status", "resolved_at", "resolved_by", "updated_at"])
    TicketActivity.objects.create(
        ticket=ticket,
        type=ActivityType.STATUS_CHANGED,
        actor=actor,
        from_value=OPEN_LABEL,
        to_value=RESOLVED_LABEL,
        text=comment,
        created_at=now,
    )
    return ticket


def add_comment(
    *,
    ticket: Ticket,
    actor: User,
    text: str,
    at: datetime | None = None,
) -> TicketActivity:
    """Anyone who can see a ticket may comment on it, whatever its status."""
    if not permissions.can_view(actor, ticket):
        raise PermissionDenied("You cannot comment on this ticket.")
    text = text.strip()
    if not text:
        raise ValidationError({"text": "Comment cannot be empty."})
    return TicketActivity.objects.create(
        ticket=ticket,
        type=ActivityType.COMMENT,
        actor=actor,
        text=text,
        created_at=at or timezone.now(),
    )
