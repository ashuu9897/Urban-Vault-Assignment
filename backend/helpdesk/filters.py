import django_filters
from django.db.models import Q, QuerySet

from .choices import OPEN_STATUSES, TicketStatus
from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    """Query params for GET /api/tickets/. Unknown choice values are rejected with 400."""

    tab = django_filters.ChoiceFilter(
        choices=[("open", "Open"), ("resolved", "Resolved")], method="filter_tab"
    )
    status = django_filters.ChoiceFilter(choices=TicketStatus.choices)
    search = django_filters.CharFilter(method="filter_search")
    ordering = django_filters.ChoiceFilter(
        choices=[("-created_at", "Newest first"), ("created_at", "Oldest first")],
        method="filter_ordering",
    )

    class Meta:
        model = Ticket
        fields = ("tab", "status", "search", "ordering")

    def filter_tab(self, queryset: QuerySet[Ticket], name: str, value: str) -> QuerySet[Ticket]:
        if value == "resolved":
            return queryset.filter(status=TicketStatus.RESOLVED)
        return queryset.filter(status__in=OPEN_STATUSES)

    def filter_search(self, queryset: QuerySet[Ticket], name: str, value: str) -> QuerySet[Ticket]:
        """Match the issue text, or the ticket code ("#TKT-1042", "tkt-1042" or "1042")."""
        term = value.strip().lstrip("#")
        if not term:
            return queryset
        return queryset.filter(Q(title__icontains=term) | Q(code__icontains=term))

    def filter_ordering(
        self, queryset: QuerySet[Ticket], name: str, value: str
    ) -> QuerySet[Ticket]:
        # `id` breaks ties so pagination is deterministic when timestamps collide.
        direction = "-" if value.startswith("-") else ""
        return queryset.order_by(f"{direction}created_at", f"{direction}id")
