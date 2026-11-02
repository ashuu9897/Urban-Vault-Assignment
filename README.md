# Facility Helpdesk

A small end-to-end ticketing app for facility management: tenant clients raise issues, the
responsible department's POC assigns a technician, and the technician (or the client) resolves
the ticket. Built with **Django REST Framework** and **React + MUI**.

- [Overview](#1-overview)
- [Tech stack](#2-tech-stack)
- [Prerequisites](#3-prerequisites)
- [Setup & run](#4-setup--run)
- [Sample data](#5-sample-data)
- [Tests & linters](#6-running-tests--linters)
- [API reference](#7-api-reference)
- [Data model](#8-data-model)
- [Key design decisions](#9-key-design-decisions)
- [Assumptions](#10-assumptions)
- [Limitations](#11-limitations)
- [Time spent](#12-time-spent)
- [What I'd improve with more time](#13-what-id-improve-with-more-time)
- [AI-assisted development disclosure](#14-ai-assisted-development-disclosure)
- [Screenshots](#15-screenshots)

---

## 1. Overview

There is no login. A **"Viewing as"** selector in the header switches between seeded users
(see [Sample data](#5-sample-data)); the choice is remembered in `localStorage`.

| Role | Sees | Can do |
|---|---|---|
| **Client** (tenant's POC, e.g. Chaitanya M of *Harness*) | Tickets they created | Create tickets; mark their open tickets resolved (comment optional); comment |
| **Department POC** (e.g. Dhananjaya Murthy, Technical Manager) | Every ticket of their department | Assign a technician of the same department (while *Pending Technician Assignment*); comment |
| **Technician** (e.g. Prakash Kumar) | Tickets assigned to them | Mark resolved with a **required** comment (while *Pending Resolution*); comment |

### Ticket lifecycle

```mermaid
stateDiagram-v2
    [*] --> PendingAssignment: Client creates ticket\n(auto-assigned to the department POC)
    PendingAssignment --> PendingResolution: POC assigns a technician
    PendingAssignment --> Resolved: Client marks resolved
    PendingResolution --> Resolved: Technician (comment required)\nor client marks resolved
    Resolved --> [*]
```

Every step writes an entry to the ticket's **activity** timeline (`created`, `auto_assigned`,
`assigned`, `status_changed`, `comment`). Anyone who can see a ticket can comment at any time.

### Screens

- **Ticket list:** Open / Resolved tabs, search (issue text or ticket code), status filter,
  created-time sort, active-filter chips, server-side pagination ("Showing 6–10 of 23").
- **Create ticket dialog** (clients): quick-issue chips, searchable issue picker grouped by
  department ("Will be routed to …"), optional description with a counter.
- **Ticket detail:** sticky summary + call-to-action panel, scrollable description and activity
  timeline (All / Actions / Comments), sticky comment box (Ctrl/⌘+Enter posts).
- Desktop shows list and detail side by side; on mobile the detail replaces the list.
- One-click light/dark toggle (first visit follows the OS setting).

---

## 2. Tech stack

| | |
|---|---|
| **Backend** | Python 3.12, Django 5.2 (LTS), Django REST Framework, django-filter, django-cors-headers, python-dotenv, dj-database-url. SQLite by default, PostgreSQL via `DATABASE_URL`. |
| **Backend tooling** | pytest + pytest-django + factory_boy, Ruff (lint + format) |
| **Frontend** | React 18 + Vite, JavaScript (JSX + PropTypes), MUI v6, TanStack Query v5, React Router v6, axios, dayjs, Inter via `@fontsource` |
| **Frontend tooling** | Vitest + React Testing Library (API modules mocked with `vi.mock`), ESLint, Prettier |

---

## 3. Prerequisites

- **Python 3.12+**
- **Node.js 20+** and **npm**
- Git

---

## 4. Setup & run

Run the backend and the frontend in two terminals. The frontend dev server proxies `/api` to
`http://localhost:8000`, so no CORS setup is needed for local development.

### Backend (http://localhost:8000)

**macOS / Linux**

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_data
python manage.py runserver 8000
```

**Windows (PowerShell)**

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py seed_data
python manage.py runserver 8000
```

`.env.example` has safe local defaults (`DEBUG=true`). With `DEBUG=false` you must set a real
`SECRET_KEY`; the app refuses to start without one.

Optional: `python manage.py createsuperuser` to browse the data at http://localhost:8000/admin/.

### Frontend (http://localhost:5173)

**macOS / Linux**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Windows (PowerShell)**

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open http://localhost:5173. If the API isn't running you'll see "Couldn't load demo users"
with a Retry button.

### Environment variables

| Backend (`backend/.env`) | Default | Purpose |
|---|---|---|
| `DEBUG` | `false` (`true` in `.env.example`) | Django debug mode |
| `SECRET_KEY` | throwaway key, only when `DEBUG=true` | Required in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated; only needed when not using the Vite proxy |
| `DATABASE_URL` | SQLite at `backend/db.sqlite3` | e.g. `postgres://user:pass@localhost:5432/helpdesk` (needs `psycopg` installed) |
| `TIME_ZONE` | `Asia/Kolkata` | Server time zone |

| Frontend (`frontend/.env`) | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | API base URL; the default goes through the Vite proxy |

---

## 5. Sample data

`python manage.py seed_data` creates:

- **4 departments**, each with 1 POC and 2 technicians.
- **3 client organizations**, each with one client POC.
- **12 issue categories** mapped to departments; 4 are quick issues (AC not cooling, Internet
  not working, Pantry not cleaned, Lights flickering).
- **~76 tickets** spread over the past 60 days in every status, generated with a fixed random
  seed **through the same service functions the API uses**, so the activity timelines are
  realistic. The newest ticket is the wireframe's example ("AC not cooling", floors 2 & 3).

It is idempotent: running it again updates the reference data and skips ticket generation.
`python manage.py seed_data --reset` deletes all tickets and generates them again (ticket codes
continue from the last id).

### Demo users (ids on a fresh database)

| ID | Name | Role | Department / Organization |
|---:|---|---|---|
| 13 | **Chaitanya M** | Client | Harness (Harness-1317; 2F, 3F) |
| 14 | Ananya Rao | Client | Zenith Labs |
| 15 | Rohit Verma | Client | Northwind |
| 1 | **Dhananjaya Murthy** | Department POC (Technical Manager) | Technical (HVAC) |
| 4 | Kavya Iyer | Department POC (IT Manager) | IT & Network |
| 7 | Meera Pillai | Department POC (Housekeeping Supervisor) | Housekeeping |
| 10 | Vikram Singh | Department POC (Electrical Lead) | Electrical |
| 2 | **Prakash Kumar** | Technician | Technical (HVAC) |
| 3 | Arjun Nair | Technician | Technical (HVAC) |
| 5 | Sameer Khan | Technician | IT & Network |
| 6 | Neha Gupta | Technician | IT & Network |
| 8 | Ramesh Babu | Technician | Housekeeping |
| 9 | Lakshmi Devi | Technician | Housekeeping (no tickets, handy for empty states) |
| 11 | Suresh Yadav | Technician | Electrical |
| 12 | Imran Sheikh | Technician | Electrical |

Chaitanya, Dhananjaya and Prakash each have several pages of tickets in both tabs.

**Suggested walkthrough:** as Chaitanya, create a "Water leakage" ticket (creating another "AC
not cooling" ticket is blocked by the 24-hour duplicate rule, by design). Switch to Dhananjaya
→ open it → **Assign Worker** → Prakash Kumar. Switch to Prakash → **Mark Resolved** with a
comment. The ticket is now under **Resolved Tickets** for all three.

---

## 6. Running tests & linters

**Backend** (from `backend/`, venv active)

```bash
pytest              # 62 tests: services, permissions, constraints, API
ruff check .        # lint
ruff format --check .
python manage.py makemigrations --check --dry-run
```

**Frontend** (from `frontend/`)

```bash
npm test            # 15 component tests (Vitest + React Testing Library)
npm run lint        # ESLint, zero warnings allowed
npm run format:check
npm run build
```

---

## 7. API reference

All endpoints are under `/api/`. Every request except `GET /api/users/` must carry the demo
header **`X-User-Id: <id>`** (see [design decisions](#9-key-design-decisions)).

| Method | Path | Purpose | Success |
|---|---|---|---|
| GET | `/api/users/` | Seeded users for the demo selector (public) | 200 |
| GET | `/api/me/` | The acting user | 200 |
| GET | `/api/issue-categories/` | Categories with department and `is_quick_issue` | 200 |
| GET | `/api/tickets/` | Paginated tickets visible to the acting user | 200 |
| POST | `/api/tickets/` | Create `{category_id, description}` (clients only) | **201** + ticket detail |
| GET | `/api/tickets/{id}/` | Detail incl. `description` and `activities` | 200 |
| GET | `/api/tickets/{id}/assignable-technicians/` | Technicians of the ticket's department (ticket's POC only) | 200 |
| POST | `/api/tickets/{id}/assign/` | `{technician_id}` | 200 + ticket detail |
| POST | `/api/tickets/{id}/resolve/` | `{comment}` | 200 + ticket detail |
| POST | `/api/tickets/{id}/comments/` | `{text}` | **201** + the new activity |

**List query params:** `tab=open|resolved`, `status=pending_assignment|pending_resolution|resolved`,
`search=` (issue text or ticket code, e.g. `1042` or `#TKT-1042`),
`ordering=-created_at|created_at` (default newest first, ties broken by id), `page=`,
`page_size=` (default 10, max 50). Unknown filter values → 400; a page past the end → 404.

**Status codes:** 200, 201; **400** validation / business rule; **401** missing or unknown
`X-User-Id`; **403** your role may not do this; **404** not found *or not visible to you*; 405.

### Example: list

```http
GET /api/tickets/?tab=open&page=2
X-User-Id: 13
```

```json
{
  "count": 22,
  "next": "http://localhost:8000/api/tickets/?page=3&tab=open",
  "previous": "http://localhost:8000/api/tickets/?tab=open",
  "results": [
    {
      "id": 41,
      "code": "TKT-1041",
      "title": "AC making noise",
      "status": "pending_resolution",
      "status_label": "Pending Resolution",
      "department": { "id": 1, "name": "Technical (HVAC)" },
      "organization": { "id": 1, "name": "Harness", "site_label": "Harness-1317; 2F, 3F" },
      "created_by": { "id": 13, "name": "Chaitanya M", "designation": "Client POC", "role": "client" },
      "assignees": [
        { "id": 1, "name": "Dhananjaya Murthy", "designation": "Technical Manager", "role": "poc" },
        { "id": 2, "name": "Prakash Kumar", "designation": "Technician", "role": "technician" }
      ],
      "created_at": "2026-10-20T15:49:00+05:30",
      "resolved_at": null,
      "available_actions": ["resolve"],
      "action_required": false
    }
  ]
}
```

### Example: create

```http
POST /api/tickets/
X-User-Id: 13
Content-Type: application/json

{ "category_id": 5, "description": "Water dripping near the 3F pantry." }
```

`201 Created` returns the full ticket detail (list fields + `description` + `activities`):

```json
{
  "id": 77,
  "code": "TKT-1077",
  "status": "pending_assignment",
  "assignees": [{ "id": 1, "name": "Dhananjaya Murthy", "designation": "Technical Manager", "role": "poc" }],
  "available_actions": ["resolve"],
  "description": "Water dripping near the 3F pantry.",
  "activities": [
    { "id": 301, "type": "created", "actor": { "id": 13, "name": "Chaitanya M", "...": "..." }, "from_value": "", "to_value": "", "to_user": null, "text": "", "created_at": "..." },
    { "id": 302, "type": "auto_assigned", "actor": null, "from_value": "Unassigned", "to_value": "", "to_user": { "id": 1, "name": "Dhananjaya Murthy", "...": "..." }, "text": "", "created_at": "..." }
  ],
  "...": "other list fields"
}
```

### Example: error

Every error has the same shape: `detail` is always a readable summary and `errors` holds
field-level messages (empty for non-validation errors).

```json
{
  "detail": "You already raised an open \"AC not cooling\" ticket in the last 24 hours (#TKT-1077). Add a comment there instead.",
  "errors": {
    "non_field_errors": [
      "You already raised an open \"AC not cooling\" ticket in the last 24 hours (#TKT-1077). Add a comment there instead."
    ]
  }
}
```

```json
{ "detail": "Please select an issue.", "errors": { "category_id": ["Please select an issue."] } }
```

---

## 8. Data model

```mermaid
erDiagram
    Department ||--o{ User : "members (POCs, technicians)"
    ClientOrganization ||--o{ User : "members (clients)"
    Department ||--o{ IssueCategory : routes
    IssueCategory ||--o{ Ticket : categorises
    Department ||--o{ Ticket : "owned by"
    ClientOrganization ||--o{ Ticket : "raised for"
    User ||--o{ Ticket : "created_by / poc / technician / resolved_by"
    Ticket ||--o{ TicketActivity : "audit trail"
    User |o--o{ TicketActivity : "actor (null = System) / to_user"
```

- **User:** a custom user model (`AbstractUser`) carrying `role`, `designation`, `department`
  (POCs and technicians) and `organization` (clients). `clean()` enforces which relation each
  role needs, and a partial unique constraint allows **one POC per department**, because
  tickets are auto-routed to "the" POC. A blank role marks an admin-site-only account.
- **Department**, **ClientOrganization** (`name`, `site_label`).
- **IssueCategory:** belongs to the department that handles it; `is_quick_issue` and
  `display_order` drive the create dialog.
- **Ticket:** `code` (`TKT-<1000+id>`), `title` copied from the category at creation, so renaming
  a category doesn't rewrite history; `description`, `department`, `organization`, `created_by`,
  `poc`, `technician`, `status`, timestamps, `resolved_at`/`resolved_by`. DB check constraints
  guarantee that *resolved ⇔ resolved_at set*, *pending assignment ⇒ no technician* and
  *pending resolution ⇒ technician set*. Composite index on `(status, created_at)`; FK columns
  are indexed automatically.
- **TicketActivity:** `type`, `actor` (null = System), `from_value` / `to_value` /
  `to_user` for the "History" line, `text` for comments, ordered by `(created_at, id)`.

---

## 9. Key design decisions

- **Service layer.** All writes go through `helpdesk/services.py` (`create_ticket`,
  `assign_technician`, `resolve_ticket`, `add_comment`), each in a transaction. Assign and resolve
  re-read the ticket with `select_for_update()` so two simultaneous clicks can't both succeed.
  `create_ticket` locks the client's row so the duplicate check can't race. Services raise
  Django's own `ValidationError` / `PermissionDenied`, so the seed command can use them too. The
  exception handler maps them to 400 / 403. Views only validate input shape and call a service.
- **`available_actions` comes from the backend.** `helpdesk/permissions.py` holds pure functions
  (`can_assign`, `can_resolve`, …) that the services enforce *and* the serializers expose as
  `available_actions` / `action_required`. The frontend renders CTAs from that list and never
  re-derives permissions, so UI and API can't disagree.
- **Demo identity via `X-User-Id`.** `DemoUserAuthentication` trusts the header. **This is not
  authentication**; it exists only so reviewers can switch users instantly. Swapping in
  session/JWT auth would only replace that class and the axios interceptor. A missing header
  returns 401 (not 403) because the class declares an `authenticate_header`.
- **404 rather than 403 for tickets you can't see.** Visibility is applied in the queryset
  (`selectors.visible_tickets_for`), so another client's or department's ticket is
  indistinguishable from a non-existent one and ids don't leak. **403** is reserved for "you can
  see this ticket but your role can't do that" (e.g. a client calling `/assign/`). A test checks
  that the Python rule (`can_view`) and the SQL rule (`visible_tickets_for`) never disagree.
- **No N+1 queries.** The list takes 3 queries regardless of page size (auth, COUNT, one SELECT
  with joins). The detail also takes 3, whatever the number of activities (auth, the ticket with
  joins, one prefetch of activities with their users). Both are asserted in tests.
- **Page-number pagination** (`?page=`) because the UI shows numbered pages and "Showing x–y of
  n". Ordering always ends with `id` so pages are stable.
- **URL-synced list state.** Tab, status, search, sort and page live in the query string
  (`useTicketListParams`): refresh, back/forward and shared links restore the view. Defaults are
  omitted to keep URLs clean, and typing in search uses `replace` so it doesn't flood history.
  A 404 for an out-of-range page falls back to page 1.
- **TanStack Query** for server state. Keys include the acting user (`['tickets', userId,
  params]`, `['ticket', userId, id]`), because the same ticket can look different to different
  users. Switching users drops the previous user's cache. Mutations write the server's response
  straight into the detail cache and invalidate list queries. Pagination keeps the previous page
  on screen while loading, but only for the same user. Only network/5xx errors are retried.
- **Reusable UI primitives.** Generic pieces (`AppDialog`, `TonalChip`, `ChoiceChips`,
  `SearchField`, `MenuSelectButton`, `PaginationBar`, `ActionCallout`, `Timeline`,
  `SegmentedControl`, `CountedTextField`, `Surface`, …) live in `components/common`; the
  `components/tickets` folder only composes them. Routes are declared in `src/routes.jsx`, and
  URLs are built in one place (`utils/paths.js`).
- **Theming.** MUI v6 `colorSchemes` with CSS variables give light and dark modes. A single
  header button toggles between them; until it's first used, the app follows the OS preference.
  The choice is persisted by MUI in `localStorage`. A tiny inline script in `index.html` applies
  the stored scheme before React loads, so dark-mode users never see a white flash. The UV logo
  is an inline SVG drawn in `currentColor`, so it flips with the theme. The SVG favicon adapts
  to the browser's own light/dark setting. Status colours are soft
  tonal chips; light-mode shades were measured to keep chip text above WCAG AA (4.5:1). Reduced
  motion is respected.
- **Accessibility.** Landmarks (`header`, `main`, `nav` for pagination, `article` for the detail),
  lists for tickets and an ordered list for the timeline, labelled inputs, `aria-live` result
  counts, `aria-pressed` chips, visible keyboard focus. Each ticket card has a single tab stop
  (View) instead of nesting a button inside a clickable card.

---

## 10. Assumptions

- Issue category → department mapping is configuration (seeded, editable in the admin); each
  department has exactly one POC.
- One technician per ticket, and no re-assignment once assigned.
- A client may mark their ticket resolved at any time, even before assignment (as in the
  wireframe). Their comment is optional; a technician's must be at least 5 characters.
- The POC stays listed as an assignee after a technician is assigned (as in the wireframe).
- Duplicate rule: a client can't raise a second **open** ticket for the same category within
  24 hours; the error names the existing ticket.
- On the Resolved tab the status filter only offers "Resolved" (it's the only possible status).
- Search matches the issue title or ticket code, not the description.
- Times are shown in the browser's time zone in the wireframe's `27-Oct-2025 11:40 AM` format.

---

## 11. Limitations

- **No real authentication or authorisation beyond the demo header.** Anyone who can reach the
  API can act as any user.
- No real-time updates: other users' changes appear on refetch/navigation, not live.
- No reopen flow, re-assignment, SLAs, attachments or notifications.
- SQLite by default; fine for the demo, but use PostgreSQL (`DATABASE_URL`) for concurrent
  writes, where the row locks also become meaningful.
- The browser-level end-to-end flow was verified manually, not with automated e2e tests.

---

## 12. Time spent

6-7 hours

---

## 13. What I'd improve with more time

- Real authentication (session or JWT/SSO) and object-level permissions in DRF.
- Reopen flow, re-assignment, SLA timers and escalation.
- Notifications (email / in-app) and live updates (WebSockets or polling).
- Attachments (photos of the issue) with object storage.
- Audit/report export (CSV) and basic dashboards per department.
- Playwright end-to-end tests of the full create → assign → resolve flow.
- CI pipeline (lint, tests, build) and Docker Compose for one-command startup with PostgreSQL.
- Internationalisation and locale-aware date formatting.

---

## 14. AI-assisted development disclosure

**Tools used.** Claude Code (Anthropic's CLI coding agent, running Claude Opus 5.5), working
directly in this repository: reading and writing files, running commands, and driving a Chrome
browser for manual testing.

**What it helped with.** I used it to write the code much faster than I could by hand,
following a detailed specification I prepared from the wireframe and UI prototype (roles,
ticket lifecycle, business rules, API contract, component list and quality bar). In
particular it helped with:

- **Backend models:** turning my data model (departments, organizations, users with roles,
  issue categories, tickets, activity log) into Django models, database constraints and
  migrations.
- **Backend boilerplate:** service functions, permission helpers, serializers, views, URL
  routing, the error handler, pagination and filters, following the structure I specified.
- **Reusable UI components:** building the generic building blocks in `components/common/`
  (dialog, chips, menus, search, pagination, callout, timeline, text field with counter) and
  the ticket screens that compose them.
- **Data and tests:** the seed command that generates realistic demo data, and first drafts of
  the backend and frontend test suites.
- **Setup and docs:** project scaffolding, lint/format configuration and the first draft of
  this README.

**What I decided or changed myself.**

- Wrote the specification above, which fixed the stack, the architecture (service layer,
  backend-driven `available_actions`, URL-synced filters, TanStack Query), the business rules
  and the acceptance criteria.
- Switched the frontend from TypeScript to **JavaScript (JSX + PropTypes)** so the codebase
  is simpler for me to own and explain.
- Asked for the component structure to be reworked: generic, content-agnostic building blocks
  (dialog, chips, menus, search, pagination, callout, timeline, text field with counter) moved
  into `components/common/`, with the ticket folder only composing them. That removed about
  ten ticket-specific wrapper components.
- Asked for the route table to live in its own file (`src/routes.jsx`).
- Questioned the implementation to understand it, e.g. where names come from (seed data vs
  code), how the API and seed data fit together, and why revisiting a list page doesn't
  trigger a new request (TanStack Query's cache and `staleTime`).


**How the output was verified.**

- **Automated tests:** 62 backend tests (services, permissions, database constraints, every
  API endpoint, pagination/filter behaviour, constant query counts) and 15 frontend component
  tests. Key tests were checked by deliberately breaking the code and confirming they fail
  (removing `select_related` broke the query-count test; dropping the technician's required
  comment broke the matching UI test).
- **Static checks:** Ruff, ESLint (zero warnings), Prettier, `makemigrations --check` and a
  production build, all clean.
- **Manual end-to-end walkthrough in a real browser** against the running API: client creates →
  POC assigns → technician resolves → ticket appears under Resolved for all three roles;
  validation and duplicate-ticket errors; search, filter, sort, pagination and out-of-range
  pages; API-down error and Retry; dark mode without flash; layouts at 360, 768, 1024 and
  1440 px with no horizontal overflow; clean browser console.
- **Issues found this way and fixed:** colour contrast of two status colours slightly below
  WCAG AA (measured, then adjusted), a corrupted character in one UI string, and slow backend
  tests (password hashing in test factories).

---

## 15. Screenshots

**Client view (light):** ticket list next to the selected ticket's detail and call to action.

![Client ticket list and detail, light mode](docs/screenshots/client-ticket-detail-light.png)

**Create New Ticket (light):** quick-issue chips, searchable issue picker and description.

![Create New Ticket dialog, light mode](docs/screenshots/create-ticket-dialog-light.png)

**Department POC view (dark):** resolved ticket with its full activity timeline.

![POC viewing a resolved ticket, dark mode](docs/screenshots/poc-resolved-ticket-dark.png)

**Filters (dark):** Resolved tab, oldest-first sort and the status filter menu, on page 2.

![Resolved tab with status filter menu, dark mode](docs/screenshots/resolved-filter-menu-dark.png)
