from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone

from .choices import ActivityType, Role, TicketStatus

TICKET_CODE_PREFIX = "TKT-"
TICKET_CODE_OFFSET = 1000


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class ClientOrganization(models.Model):
    name = models.CharField(max_length=100, unique=True)
    site_label = models.CharField(max_length=150, help_text='e.g. "Harness-1317; 2F, 3F"')

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class User(AbstractUser):
    """
    Custom user so the helpdesk role lives on the user itself (no profile join).

    `role` is blank only for admin-site accounts that don't take part in the helpdesk;
    the API ignores such users entirely.
    """

    role = models.CharField(max_length=20, choices=Role.choices, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, null=True, blank=True, related_name="members"
    )
    organization = models.ForeignKey(
        ClientOrganization,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="members",
    )

    class Meta:
        constraints = [
            # Tickets are auto-routed to "the" POC of a department, so there can only be one.
            models.UniqueConstraint(
                fields=["department"],
                condition=Q(role=Role.POC),
                name="one_poc_per_department",
            ),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def name(self) -> str:
        return self.get_full_name() or self.username

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        if self.role in (Role.POC, Role.TECHNICIAN):
            if not self.department_id:
                errors["department"] = "Department POCs and technicians need a department."
            if self.organization_id:
                errors["organization"] = "Only clients belong to an organization."
        elif self.role == Role.CLIENT:
            if not self.organization_id:
                errors["organization"] = "Clients need an organization."
            if self.department_id:
                errors["department"] = "Clients do not belong to a department."
        if errors:
            raise ValidationError(errors)


class IssueCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name="issue_categories"
    )
    is_quick_issue = models.BooleanField(
        default=False, help_text="Shown as a one-tap chip in the create-ticket dialog."
    )
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name_plural = "issue categories"

    def __str__(self) -> str:
        return self.name


class Ticket(models.Model):
    # Assigned right after the first INSERT because it is derived from the primary key.
    # NULL (not "") while unset, so concurrent inserts never collide on the unique index.
    code = models.CharField(max_length=20, unique=True, null=True, editable=False)  # noqa: DJ001
    category = models.ForeignKey(IssueCategory, on_delete=models.PROTECT, related_name="tickets")
    # Denormalised from the category at creation so renaming a category never rewrites history.
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, max_length=1000)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name="tickets")
    organization = models.ForeignKey(
        ClientOrganization, on_delete=models.PROTECT, related_name="tickets"
    )
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="created_tickets")
    poc = models.ForeignKey(User, on_delete=models.PROTECT, related_name="poc_tickets")
    technician = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )
    status = models.CharField(
        max_length=30, choices=TicketStatus.choices, default=TicketStatus.PENDING_ASSIGNMENT
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="resolved_tickets",
    )

    class Meta:
        ordering = ["-created_at", "-id"]
        # Foreign keys (department, technician, created_by, ...) are indexed by Django
        # automatically; this composite index serves the tab filter + created-time sort.
        indexes = [models.Index(fields=["status", "created_at"], name="ticket_status_created_idx")]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(status=TicketStatus.RESOLVED, resolved_at__isnull=False)
                    | (~Q(status=TicketStatus.RESOLVED) & Q(resolved_at__isnull=True))
                ),
                name="ticket_resolved_at_matches_status",
            ),
            models.CheckConstraint(
                condition=~Q(status=TicketStatus.PENDING_ASSIGNMENT) | Q(technician__isnull=True),
                name="ticket_pending_assignment_has_no_technician",
            ),
            models.CheckConstraint(
                condition=~Q(status=TicketStatus.PENDING_RESOLUTION) | Q(technician__isnull=False),
                name="ticket_pending_resolution_has_technician",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.title}"

    def save(self, *args, **kwargs) -> None:
        super().save(*args, **kwargs)
        if not self.code:
            self.code = f"{TICKET_CODE_PREFIX}{TICKET_CODE_OFFSET + self.pk}"
            super().save(update_fields=["code"])

    @property
    def is_open(self) -> bool:
        return self.status != TicketStatus.RESOLVED


class TicketActivity(models.Model):
    """One entry in a ticket's audit trail. A null actor means the System did it."""

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="activities")
    type = models.CharField(max_length=20, choices=ActivityType.choices)
    actor = models.ForeignKey(
        User, on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    from_value = models.CharField(max_length=50, blank=True)
    to_value = models.CharField(max_length=50, blank=True)
    to_user = models.ForeignKey(
        User, on_delete=models.PROTECT, null=True, blank=True, related_name="+"
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at", "id"]
        verbose_name_plural = "ticket activities"

    def __str__(self) -> str:
        return f"{self.get_type_display()} on {self.ticket_id}"
