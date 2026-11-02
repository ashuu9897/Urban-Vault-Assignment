from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import ClientOrganization, Department, IssueCategory, Ticket, TicketActivity, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "name", "role", "designation", "department", "organization")
    list_filter = ("role", "department", "organization", "is_staff")
    list_select_related = ("department", "organization")
    fieldsets = (
        *BaseUserAdmin.fieldsets,
        ("Helpdesk", {"fields": ("role", "designation", "department", "organization")}),
    )


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(ClientOrganization)
class ClientOrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "site_label")
    search_fields = ("name", "site_label")


@admin.register(IssueCategory)
class IssueCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "department", "is_quick_issue", "display_order")
    list_filter = ("department", "is_quick_issue")
    list_editable = ("is_quick_issue", "display_order")
    search_fields = ("name",)


class TicketActivityInline(admin.TabularInline):
    model = TicketActivity
    extra = 0
    can_delete = False
    fields = ("created_at", "type", "actor", "from_value", "to_value", "to_user", "text")
    readonly_fields = fields

    def has_add_permission(self, request, obj=None) -> bool:
        return False


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """Read-mostly: state changes must go through the service layer to keep the audit trail."""

    list_display = ("code", "title", "status", "department", "organization", "created_at")
    list_filter = ("status", "department", "organization")
    list_select_related = ("department", "organization")
    search_fields = ("code", "title", "description")
    date_hierarchy = "created_at"
    readonly_fields = (
        "code",
        "category",
        "department",
        "organization",
        "created_by",
        "poc",
        "technician",
        "status",
        "created_at",
        "updated_at",
        "resolved_at",
        "resolved_by",
    )
    inlines = [TicketActivityInline]

    def has_add_permission(self, request) -> bool:
        return False
