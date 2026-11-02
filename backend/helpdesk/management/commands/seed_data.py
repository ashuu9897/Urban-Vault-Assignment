"""
`python manage.py seed_data [--reset]`

Creates the demo departments, organizations, users and issue categories (idempotent),
then generates ~80 tickets of realistic history by calling the same service functions the
API uses, with a fixed random seed so every run produces the same data.
"""

import random
from dataclasses import dataclass
from datetime import datetime, timedelta

from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from helpdesk import services
from helpdesk.choices import Role
from helpdesk.models import ClientOrganization, Department, IssueCategory, Ticket, User

RANDOM_SEED = 42
TICKET_COUNT = 80
HISTORY_DAYS = 60


@dataclass(frozen=True)
class DepartmentSeed:
    name: str
    poc: tuple[str, str]  # (full name, designation)
    technicians: tuple[str, ...]


@dataclass(frozen=True)
class CategorySeed:
    name: str
    department: str
    quick: bool
    weight: int  # relative frequency in generated tickets
    description: str


DEPARTMENTS = (
    DepartmentSeed(
        "Technical (HVAC)",
        ("Dhananjaya Murthy", "Technical Manager"),
        ("Prakash Kumar", "Arjun Nair"),
    ),
    DepartmentSeed("IT & Network", ("Kavya Iyer", "IT Manager"), ("Sameer Khan", "Neha Gupta")),
    DepartmentSeed(
        "Housekeeping",
        ("Meera Pillai", "Housekeeping Supervisor"),
        ("Ramesh Babu", "Lakshmi Devi"),
    ),
    DepartmentSeed(
        "Electrical", ("Vikram Singh", "Electrical Lead"), ("Suresh Yadav", "Imran Sheikh")
    ),
)

# (client name, organization, site label, share of generated tickets)
CLIENTS = (
    ("Chaitanya M", "Harness", "Harness-1317; 2F, 3F", 55),
    ("Ananya Rao", "Zenith Labs", "Zenith-0412; 5F", 25),
    ("Rohit Verma", "Northwind", "Northwind-2208; 1F", 20),
)

WIREFRAME_DESCRIPTION = (
    "The air conditioning units on floors 2 and 3 have stopped cooling effectively since this "
    "morning. Multiple clients are complaining about uncomfortable temperatures. The units appear "
    "to be running but producing warm air. Last service was 4 months ago. Clients on Floor 3 "
    "(server room side cabin) are affected most severely."
)

# Grouped by department; list position becomes `display_order` (dropdown + chip order).
CATEGORIES = (
    CategorySeed("AC not cooling", "Technical (HVAC)", True, 12, WIREFRAME_DESCRIPTION),
    CategorySeed(
        "Water leakage",
        "Technical (HVAC)",
        False,
        3,
        "Water is dripping from the ceiling near the reception. A bucket has been placed "
        "temporarily.",
    ),
    CategorySeed(
        "AC making noise",
        "Technical (HVAC)",
        False,
        3,
        "The AC unit in conference room B makes a loud rattling noise when it starts.",
    ),
    CategorySeed(
        "Internet not working",
        "IT & Network",
        True,
        4,
        "The wired internet connection is down across the east wing. Laptops show "
        "'connected, no internet' and video calls keep dropping.",
    ),
    CategorySeed(
        "Wi-Fi slow", "IT & Network", False, 2, "Wi-Fi speeds drop below 2 Mbps every afternoon."
    ),
    CategorySeed(
        "Printer not working",
        "IT & Network",
        False,
        1,
        "The shared printer on the 2nd floor shows a paper jam error even when empty.",
    ),
    CategorySeed(
        "Pantry not cleaned",
        "Housekeeping",
        True,
        3,
        "The pantry has not been cleaned since yesterday evening. Used cups are piling up "
        "near the coffee machine.",
    ),
    CategorySeed(
        "Washroom not clean",
        "Housekeeping",
        False,
        2,
        "The washroom on the 3rd floor needs cleaning and the soap dispensers are empty.",
    ),
    CategorySeed(
        "Garbage not collected",
        "Housekeeping",
        False,
        1,
        "Garbage bins near the cafeteria have not been emptied today.",
    ),
    CategorySeed(
        "Lights flickering",
        "Electrical",
        True,
        3,
        "Ceiling lights near the meeting rooms flicker every few seconds. It is distracting "
        "during meetings.",
    ),
    CategorySeed(
        "Power outage",
        "Electrical",
        False,
        2,
        "Power keeps tripping in the server-side cabin, roughly every hour.",
    ),
    CategorySeed(
        "Socket not working",
        "Electrical",
        False,
        1,
        "Two power sockets at desks 14 and 15 are not working.",
    ),
)

TECHNICIAN_ACK = "On it - will visit the site shortly."
TECHNICIAN_FIX = "Fixed and verified on site. Please raise a new ticket if the issue comes back."
CLIENT_RESOLVE = "Issue no longer persists. Thanks!"
CLIENT_FOLLOW_UP = "Any update on this? It is still affecting our team."
POC_NOTE = "Noted. Prioritising this with the team today."


def username_for(full_name: str) -> str:
    return full_name.lower().replace(" ", ".")


class Command(BaseCommand):
    help = "Seed demo users, issue categories and ~80 tickets. Safe to run repeatedly."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all tickets (and their activity) before generating new ones.",
        )

    @transaction.atomic
    def handle(self, *args, reset: bool = False, **options) -> None:
        self._seed_reference_data()

        if reset:
            deleted, _ = Ticket.objects.all().delete()
            self.stdout.write(f"Deleted {deleted} ticket rows (tickets + activities).")

        if Ticket.objects.exists():
            self.stdout.write("Tickets already exist - skipping generation (use --reset).")
        else:
            created = self._generate_tickets()
            self.stdout.write(self.style.SUCCESS(f"Created {created} tickets."))

        self._print_user_table()

    # ------------------------------------------------------------------ reference data

    def _seed_reference_data(self) -> None:
        departments = {}
        for dept in DEPARTMENTS:
            departments[dept.name], _ = Department.objects.get_or_create(name=dept.name)
            poc_name, poc_designation = dept.poc
            self._upsert_user(
                poc_name, Role.POC, poc_designation, department=departments[dept.name]
            )
            for tech_name in dept.technicians:
                self._upsert_user(
                    tech_name, Role.TECHNICIAN, "Technician", department=departments[dept.name]
                )

        for client_name, org_name, site_label, _ in CLIENTS:
            org, _ = ClientOrganization.objects.update_or_create(
                name=org_name, defaults={"site_label": site_label}
            )
            self._upsert_user(client_name, Role.CLIENT, "Client POC", organization=org)

        for order, cat in enumerate(CATEGORIES):
            IssueCategory.objects.update_or_create(
                name=cat.name,
                defaults={
                    "department": departments[cat.department],
                    "is_quick_issue": cat.quick,
                    "display_order": order,
                },
            )

    @staticmethod
    def _upsert_user(full_name: str, role: str, designation: str, **relations) -> User:
        first_name, _, last_name = full_name.partition(" ")
        user, created = User.objects.update_or_create(
            username=username_for(full_name),
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "designation": designation,
                "department": relations.get("department"),
                "organization": relations.get("organization"),
            },
        )
        if created:
            user.set_unusable_password()  # demo users never log in
            user.save(update_fields=["password"])
        return user

    # ------------------------------------------------------------------ tickets

    def _generate_tickets(self) -> int:
        rng = random.Random(RANDOM_SEED)
        now = timezone.now()
        clients = [User.objects.get(username=username_for(c[0])) for c in CLIENTS]
        client_weights = [c[3] for c in CLIENTS]
        categories = {c.name: c for c in IssueCategory.objects.select_related("department")}
        category_seeds = list(CATEGORIES)

        # Oldest first, so the duplicate-ticket rule sees history in the right order.
        # Everything is at least 26h old; the "live" wireframe ticket is added last.
        created_times = sorted(
            now - timedelta(hours=26 + rng.uniform(0, HISTORY_DAYS * 24))
            for _ in range(TICKET_COUNT - 1)
        )
        created = 0
        for created_at in created_times:
            client = rng.choices(clients, weights=client_weights)[0]
            seed = rng.choices(category_seeds, weights=[c.weight for c in category_seeds])[0]
            try:
                ticket = services.create_ticket(
                    client=client,
                    category=categories[seed.name],
                    description=seed.description if rng.random() > 0.15 else "",
                    at=created_at,
                )
            except ValidationError:
                continue  # Duplicate-ticket rule kicked in; real clients would see a 400 too.
            created += 1
            self._play_lifecycle(ticket, client, rng, now)

        services.create_ticket(
            client=clients[0],
            category=categories["AC not cooling"],
            description=WIREFRAME_DESCRIPTION,
            at=now - timedelta(hours=2),
        )
        return created + 1

    def _play_lifecycle(
        self, ticket: Ticket, client: User, rng: random.Random, now: datetime
    ) -> None:
        """Move a ticket through assignment and resolution with realistic delays."""
        poc = ticket.poc
        outcome = rng.random()  # < 0.25 stays unassigned, < 0.55 stays in progress, else resolved
        if outcome < 0.25:
            if rng.random() < 0.4:
                services.add_comment(
                    ticket=ticket,
                    actor=client,
                    text=CLIENT_FOLLOW_UP,
                    at=ticket.created_at + timedelta(hours=rng.randint(4, 20)),
                )
            return

        assigned_at = ticket.created_at + timedelta(hours=rng.randint(1, 20))
        if assigned_at > now - timedelta(hours=1):
            return
        technician = self._pick_technician(ticket, rng)
        if rng.random() < 0.3:
            services.add_comment(ticket=ticket, actor=poc, text=POC_NOTE, at=assigned_at)
        ticket = services.assign_technician(
            ticket=ticket,
            actor=poc,
            technician_id=technician.id,
            at=assigned_at + timedelta(minutes=5),
        )
        if rng.random() < 0.85:
            services.add_comment(
                ticket=ticket,
                actor=technician,
                text=TECHNICIAN_ACK,
                at=assigned_at + timedelta(hours=2),
            )

        resolved_at = assigned_at + timedelta(hours=rng.randint(3, 42))
        if outcome < 0.55 or resolved_at > now - timedelta(hours=1):
            return
        if rng.random() < 0.65:
            services.resolve_ticket(
                ticket=ticket, actor=technician, comment=TECHNICIAN_FIX, at=resolved_at
            )
        else:
            comment = CLIENT_RESOLVE if rng.random() < 0.7 else ""
            services.resolve_ticket(ticket=ticket, actor=client, comment=comment, at=resolved_at)

    @staticmethod
    def _pick_technician(ticket: Ticket, rng: random.Random) -> User:
        technicians = list(
            User.objects.filter(role=Role.TECHNICIAN, department=ticket.department).order_by("id")
        )
        # Bias towards the first technician so Prakash Kumar (HVAC) has several pages of work.
        weights = [6] + [1] * (len(technicians) - 1)
        return rng.choices(technicians, weights=weights)[0]

    # ------------------------------------------------------------------ output

    def _print_user_table(self) -> None:
        self.stdout.write("\nDemo users (select them in the app's 'Viewing as' menu):")
        self.stdout.write(f"  {'ID':>3}  {'Name':<20} {'Role':<16} {'Department / Organization'}")
        users = User.objects.exclude(role="").select_related("department", "organization")
        for user in users.order_by("role", "id"):
            team = user.department or user.organization
            self.stdout.write(
                f"  {user.id:>3}  {user.name:<20} {user.get_role_display():<16} {team}"
            )
