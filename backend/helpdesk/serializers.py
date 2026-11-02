"""
Output serializers describe what the API returns; input serializers only validate the
shape of request bodies. Business rules live in `services.py`, not here.
"""

from rest_framework import serializers

from . import permissions
from .models import ClientOrganization, Department, IssueCategory, Ticket, TicketActivity, User
from .services import COMMENT_MAX_LENGTH, DESCRIPTION_MAX_LENGTH

# --------------------------------------------------------------------------- output


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ("id", "name")


class ClientOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientOrganization
        fields = ("id", "name", "site_label")


class UserSummarySerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "name", "designation", "role")


class UserSerializer(UserSummarySerializer):
    department = DepartmentSerializer(read_only=True)
    organization = ClientOrganizationSerializer(read_only=True)

    class Meta(UserSummarySerializer.Meta):
        fields = (*UserSummarySerializer.Meta.fields, "department", "organization")


class IssueCategorySerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = IssueCategory
        fields = ("id", "name", "department", "is_quick_issue")


class TicketActivitySerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True, allow_null=True)
    to_user = UserSummarySerializer(read_only=True, allow_null=True)

    class Meta:
        model = TicketActivity
        fields = ("id", "type", "actor", "from_value", "to_value", "to_user", "text", "created_at")


class TicketListSerializer(serializers.ModelSerializer):
    """Lean representation for list rows. Requires `request` in the serializer context."""

    status_label = serializers.CharField(source="get_status_display", read_only=True)
    department = DepartmentSerializer(read_only=True)
    organization = ClientOrganizationSerializer(read_only=True)
    created_by = UserSummarySerializer(read_only=True)
    assignees = serializers.SerializerMethodField()
    available_actions = serializers.SerializerMethodField()
    action_required = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = (
            "id",
            "code",
            "title",
            "status",
            "status_label",
            "department",
            "organization",
            "created_by",
            "assignees",
            "created_at",
            "resolved_at",
            "available_actions",
            "action_required",
        )

    def get_assignees(self, ticket: Ticket) -> list[dict]:
        """The POC stays an assignee after a technician joins (as in the wireframe)."""
        people = [ticket.poc, ticket.technician]
        return UserSummarySerializer([p for p in people if p], many=True).data

    def get_available_actions(self, ticket: Ticket) -> list[str]:
        return permissions.available_actions(self._acting_user, ticket)

    def get_action_required(self, ticket: Ticket) -> bool:
        return permissions.is_action_required(self._acting_user, ticket)

    @property
    def _acting_user(self) -> User:
        return self.context["request"].user


class TicketDetailSerializer(TicketListSerializer):
    activities = TicketActivitySerializer(many=True, read_only=True)

    class Meta(TicketListSerializer.Meta):
        fields = (*TicketListSerializer.Meta.fields, "description", "activities")


# --------------------------------------------------------------------------- input


class TicketCreateSerializer(serializers.Serializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=IssueCategory.objects.select_related("department"),
        error_messages={
            "required": "Please select an issue.",
            "null": "Please select an issue.",
            "does_not_exist": "Select a valid issue.",
            "incorrect_type": "Select a valid issue.",
        },
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=DESCRIPTION_MAX_LENGTH,
        error_messages={
            "max_length": f"Description must be at most {DESCRIPTION_MAX_LENGTH} characters."
        },
    )


class AssignTechnicianSerializer(serializers.Serializer):
    technician_id = serializers.IntegerField(
        error_messages={
            "required": "Please select a technician.",
            "null": "Please select a technician.",
            "invalid": "Select a valid technician.",
        }
    )


class ResolveTicketSerializer(serializers.Serializer):
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=COMMENT_MAX_LENGTH,
        error_messages={"max_length": f"Comment must be at most {COMMENT_MAX_LENGTH} characters."},
    )


class CommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField(
        max_length=COMMENT_MAX_LENGTH,
        error_messages={
            "required": "Comment cannot be empty.",
            "blank": "Comment cannot be empty.",
            "max_length": f"Comment must be at most {COMMENT_MAX_LENGTH} characters.",
        },
    )
