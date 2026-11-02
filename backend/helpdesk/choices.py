from django.db import models


class Role(models.TextChoices):
    CLIENT = "client", "Client"
    POC = "poc", "Department POC"
    TECHNICIAN = "technician", "Technician"


class TicketStatus(models.TextChoices):
    PENDING_ASSIGNMENT = "pending_assignment", "Pending Technician Assignment"
    PENDING_RESOLUTION = "pending_resolution", "Pending Resolution"
    RESOLVED = "resolved", "Resolved"


OPEN_STATUSES = (TicketStatus.PENDING_ASSIGNMENT, TicketStatus.PENDING_RESOLUTION)


class ActivityType(models.TextChoices):
    CREATED = "created", "Created"
    AUTO_ASSIGNED = "auto_assigned", "Auto-assigned"
    ASSIGNED = "assigned", "Assigned"
    STATUS_CHANGED = "status_changed", "Status changed"
    COMMENT = "comment", "Comment"


# Human-readable values stored in TicketActivity.from_value / to_value.
UNASSIGNED_LABEL = "Unassigned"
OPEN_LABEL = "Open"
RESOLVED_LABEL = "Resolved"
