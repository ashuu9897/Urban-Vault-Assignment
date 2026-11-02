"""
Thin HTTP layer: authenticate, load visible objects, validate input, call a service,
serialize the result. No business rules live here.
"""

from django.db.models import QuerySet
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from . import permissions, selectors, services
from .filters import TicketFilter
from .models import Ticket
from .serializers import (
    AssignTechnicianSerializer,
    CommentCreateSerializer,
    IssueCategorySerializer,
    ResolveTicketSerializer,
    TicketActivitySerializer,
    TicketCreateSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    UserSerializer,
    UserSummarySerializer,
)


class UserListView(generics.ListAPIView):
    """Seeded users for the demo "Viewing as" selector; readable before choosing a user."""

    permission_classes = (AllowAny,)
    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self) -> QuerySet:
        return selectors.helpdesk_users()


class MeView(APIView):
    def get(self, request: Request) -> Response:
        return Response(UserSerializer(request.user).data)


class IssueCategoryListView(generics.ListAPIView):
    serializer_class = IssueCategorySerializer
    pagination_class = None

    def get_queryset(self) -> QuerySet:
        return selectors.issue_categories()


class TicketViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    filterset_class = TicketFilter

    def get_queryset(self) -> QuerySet[Ticket]:
        if self.action == "retrieve":
            return selectors.ticket_detail_queryset(self.request.user)
        return selectors.visible_tickets_for(self.request.user)

    def get_serializer_class(self):
        return TicketListSerializer if self.action == "list" else TicketDetailSerializer

    def create(self, request: Request) -> Response:
        payload = self._validated(TicketCreateSerializer, request)
        ticket = services.create_ticket(
            client=request.user,
            category=payload["category_id"],
            description=payload["description"],
        )
        return self._detail_response(ticket, status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="assignable-technicians")
    def assignable_technicians(self, request: Request, pk: str) -> Response:
        ticket = self.get_object()
        if not permissions.is_ticket_poc(request.user, ticket):
            raise PermissionDenied("Only the department POC can view assignable technicians.")
        technicians = selectors.assignable_technicians(ticket)
        return Response(UserSummarySerializer(technicians, many=True).data)

    @action(detail=True, methods=["post"])
    def assign(self, request: Request, pk: str) -> Response:
        payload = self._validated(AssignTechnicianSerializer, request)
        ticket = services.assign_technician(
            ticket=self.get_object(), actor=request.user, technician_id=payload["technician_id"]
        )
        return self._detail_response(ticket)

    @action(detail=True, methods=["post"])
    def resolve(self, request: Request, pk: str) -> Response:
        payload = self._validated(ResolveTicketSerializer, request)
        ticket = services.resolve_ticket(
            ticket=self.get_object(), actor=request.user, comment=payload["comment"]
        )
        return self._detail_response(ticket)

    @action(detail=True, methods=["post"])
    def comments(self, request: Request, pk: str) -> Response:
        payload = self._validated(CommentCreateSerializer, request)
        activity = services.add_comment(
            ticket=self.get_object(), actor=request.user, text=payload["text"]
        )
        return Response(TicketActivitySerializer(activity).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _validated(serializer_class, request: Request) -> dict:
        serializer = serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def _detail_response(self, ticket: Ticket, status_code: int = status.HTTP_200_OK) -> Response:
        """Re-read the ticket with all relations so responses always match GET detail."""
        fresh = selectors.ticket_detail_queryset(self.request.user).get(pk=ticket.pk)
        data = TicketDetailSerializer(fresh, context=self.get_serializer_context()).data
        return Response(data, status=status_code)
