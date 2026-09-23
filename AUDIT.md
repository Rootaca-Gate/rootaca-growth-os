# ROOTACA Partnership CRM — Project Audit

**Date:** 2026-09-23  
**Scope:** Phase A only — understand existing Rootaca Growth OS and recommend CRM integration.  
**Status:** No CRM / Partnerships code exists today. Do not implement until Phase B.

---

## Current Architecture

### Monorepo

| Item | Detail |
|------|--------|
| Root | `rootaca-growth-os` |
| Workspaces | npm workspaces: `apps/api`, `apps/web` |
| Shared packages | None (`packages/` does not exist) |
| Node | `>=20.19.0` |

### Stack decisions (keep as-is)

| Layer | Technology |
|-------|------------|
| Frontend framework | Angular **22** (standalone components, signals, lazy routes) |
| UI library | Angular Material / CDK **22** |
| Styling | Global SCSS + CSS variables `--ra-*` (no Tailwind) |
| i18n / RTL | Custom `DirectionService` + `MESSAGES` (`en` / `ar`) + `TPipe` |
| State | Component signals + `HttpClient` services (no NgRx) |
| Backend | NestJS **11** |
| ORM / DB | Prisma **6** + PostgreSQL |
| Auth | JWT access + refresh tokens; passwords via argon2 / hash-wasm |
| API style | REST under global prefix `api` |
| Web deploy | Firebase Hosting (`rootaca-admin`) |
| API deploy | Vercel (`rootaca-growth-os-api.vercel.app`) |
| Local DB | Docker Compose Postgres 16 |

**Rule:** Integrate the CRM as a peer module. Do not replace Angular, Nest, Prisma, Firebase, Vercel, JWT roles, or the design system.

---

## Existing Modules

### Backend (`apps/api/src`)

Registered in `app.module.ts`:

- `AuthModule` — login / refresh / logout / me
- `AdminModule` — ADMIN probe
- `HealthModule`
- `StudentsModule`
- `OrientationModule` — 20‑min assessment sessions
- `PlacementModule` — levels, skills, paths, placement overrides
- `RoadmapModule`
- `KpiModule`
- `ProjectModule`
- `ProgressModule`
- `ReportModule` — JSON + PDF progress reports
- `DashboardModule` — operational Growth OS dashboard
- `PrismaModule`

### Frontend (`apps/web/src/app`)

| Area | Paths / features |
|------|------------------|
| Auth | `/login` |
| Overview | `/dashboard` (home) |
| Students | `/students`, create/edit/profile |
| Orientation | `/orientation`, `/assessments`, wizard under student |
| Learning | `/roadmaps`, `/learning-paths`, `/projects` |
| Tracking | `/kpis`, `/progress`, `/activity` |
| Configuration | `/levels`, `/skills` |
| Settings | `/settings` (route exists; **not** in sidebar) |
| Reports | `/students/:id/report` |

Sidebar source of truth: `apps/web/src/app/layout/nav.ts` (`APP_NAV`).

---

## Existing Database

- Schema: `apps/api/prisma/schema.prisma`
- Migrations: `apps/api/prisma/migrations/`
- Seed: `apps/api/prisma/seed.ts` (+ catalog seed helpers)

### Adapter behavior (`prisma-adapter.ts`)

- **Vercel:** `PrismaNeon` (WebSocket; HTTP for ordinary queries via `poolQueryViaFetch`)
- **Local / non-Vercel:** `PrismaPg` (TCP)
- Env: `DATABASE_URL` (pooled) + `DIRECT_URL` (migrate)

### Domain today (no CRM tables)

Users, refresh tokens, students, orientation/assessment catalog + sessions, placement (levels/skills/paths), roadmaps, KPIs, educational projects, progress reviews.

### Roles enum

```text
ADMIN | MENTOR | COUNSELOR
```

### Audit logging today

- **No global audit log table.**
- Placement overrides store system vs final + reason/actor fields (inline audit trail only).
- CRM should introduce a lightweight `PartnershipAuditEvent` (or similar) for important actions.

---

## Existing APIs

Global prefix: `/api` (env `API_PREFIX`).

### Conventions to mirror

- Controllers with Swagger `@ApiTags` + `@ApiBearerAuth('JWT')`
- `ParseUUIDPipe` for ids
- class-validator DTOs + global `ValidationPipe` (whitelist)
- Paginated lists: `page`, `pageSize` (max 100), `sortBy`, `sortOrder`, `search`, filters
- Response shape example (students): `{ items, total, page, pageSize, pageCount }`
- Canonical list pattern: `QueryStudentsDto` / `PaginatedStudentsDto`

### Auth / authorization

| Mechanism | Behavior |
|-----------|----------|
| Global `JwtAuthGuard` | All routes require JWT unless `@Public()` |
| Global `RolesGuard` | If `@Roles(...)` present, enforce membership |
| No `@Roles` | Any authenticated role may call |

ADMIN-only examples: KPI catalog mutating endpoints, project catalog mutating endpoints.  
Many student write endpoints allow `ADMIN` + `MENTOR`.

**CRM recommendation:** All partnership CRM APIs require JWT. Default write access: `@Roles(Role.ADMIN, Role.MENTOR)`. Master-data destructive ops may be `ADMIN` only if needed.

### Notable endpoints (existing)

| Area | Examples |
|------|----------|
| Auth | `POST /api/auth/login`, `refresh`, `logout`, `GET /api/auth/me` |
| Students | `GET/POST /api/students`, `GET/PATCH /api/students/:id` |
| Orientation | `/api/orientation-sessions` |
| Dashboard | `GET /api/dashboard` |
| Reports | `GET /api/students/:id/report`, `.../report.pdf` |

---

## Existing Authentication (Web)

| File | Role |
|------|------|
| `core/auth/auth.service.ts` | login/refresh/logout/me; tokens in `localStorage` |
| `core/auth/auth.interceptor.ts` | Bearer + refresh on 401 |
| `core/auth/auth.guard.ts` | `authGuard` / `guestGuard` |

Prod API base: `apps/web/src/environments/environment.prod.ts` → `https://rootaca-growth-os-api.vercel.app/api`  
Dev: `/api` via `proxy.conf.json` → `localhost:3000`.

---

## Existing UI Components

### Shared (`apps/web/src/app/shared/`)

- `PageHeader`, `SectionHeader`, `StatCard`
- `EmptyState`, `ErrorState`, `LoadingSkeleton`
- `StatusBadge`, `StatusChip`, `ProgressBar`
- `Timeline`, `StudentAvatar`
- `httpErrorMessage()` helper
- `ComingSoonPanel`

### Design system

- Tokens in `apps/web/src/styles.scss` (`--ra-*`)
- Layout shell: `layout/app-shell.*`
- Utility classes: `.ra-card`, `.ra-filters`, `.ra-table-wrap`, `.ra-loading`, `.ra-skeleton`
- Charts already used on Growth dashboard: `dashboard-bar-chart`, `dashboard-line-chart`

### Patterns CRM must reuse

| Need | Reuse from |
|------|------------|
| Paginated table + filters | `students-list.page` |
| Detail profile sections | `student-profile.page` |
| Forms | `student-form` + Material form fields |
| Timeline | `shared/timeline.ts` |
| Empty / error / loading | shared components above |
| Stats cards | `StatCard` / home dashboard |
| EN/AR copy | `core/i18n/messages.ts` + `TPipe` |

**Do not** introduce Tailwind or a separate visual language.

---

## Firebase / Backend Deploy Notes

| Concern | Detail |
|---------|--------|
| Firebase | `firebase.json` + `.firebaserc` project `rootaca-admin`; `npm run deploy:web` |
| Vercel API | Nest serverless; Prisma Neon adapter; CORS includes Firebase origins |
| Env template | `.env.example` — no CRM-specific vars needed for Phase 1 |

---

## Testing Landscape

| App | Runner | Location |
|-----|--------|----------|
| API unit | Jest | `apps/api/src/**/*.spec.ts` |
| API e2e | Jest | `apps/api/test/*.e2e-spec.ts` |
| Web | Vitest via Angular | colocated `*.spec.ts` |

CRM should add unit + e2e coverage following students/KPI patterns.

---

## Recommended CRM Integration

### Naming (fit Nest/Angular conventions)

| Concern | Recommendation |
|---------|----------------|
| Nest module folder | `apps/api/src/partnerships/` |
| API prefix style | `/api/partnerships/...` (or nested resources under it) |
| Angular feature | `apps/web/src/app/features/partnerships/` |
| Nav section | New `PARTNERSHIPS` section in `nav.ts` only — do not reorder existing sections |

### Suggested sidebar addition

```text
PARTNERSHIPS
  Dashboard      → /partnerships
  Institutions   → /partnerships/institutions
  Contacts       → /partnerships/contacts
  Leads          → /partnerships/leads
  Follow-ups     → /partnerships/follow-ups
  Activities     → /partnerships/activities
  Import         → /partnerships/import
```

Master data / settings can live under `/partnerships/settings` (or Configuration) without removing Growth OS settings.

### Database (Phase B — planned, not implemented)

Normalized Prisma models with enums (not free text) for:

- `PartnershipSource`
- `PartnershipInstitution` (+ tech/partnership flags, status, priority)
- `PartnershipContact`
- `PartnershipLead`
- `PartnershipActivity`
- `PartnershipFollowUp`
- `PartnershipNote`
- Master enums/tables: institution type, category, curriculum
- `PartnershipAuditEvent`
- Indexes for: status, governorate, city, name, website domain, phone, email, next action dates
- Pagination-first queries for 10k–100k+ institutions

### API shape (adapt to Nest conventions)

Prefer:

- `GET /api/partnerships/dashboard`
- `GET|POST /api/partnerships/institutions`
- `GET|PATCH|DELETE /api/partnerships/institutions/:id`
- Nested or sibling resources for contacts, leads, activities, follow-ups, notes
- `POST /api/partnerships/imports/institutions` (preview + commit steps)

Exact paths will follow existing controller style when Phase C starts.

### Frontend pages (planned)

Mirror students list/detail:

1. Partnership dashboard  
2. Institutions list + institution detail (CRM profile)  
3. Contacts list  
4. Leads (table + kanban if CDK drag-drop stays clean)  
5. Follow-ups boards (today / overdue / upcoming / completed)  
6. Activities feed  
7. CSV import wizard (map → preview → validate → import)  

### Authorization

- Authenticated staff only  
- Recommend `@Roles(Role.ADMIN, Role.MENTOR)` for CRM mutations  
- No public CRM endpoints  

### Explicitly out of Phase 1 (Phase 2+)

Email sending/automation, WhatsApp, AI enrichment, scraping, external research APIs, complex campaign analytics.

### Extension points to leave clean

- `source` on institutions/leads  
- `activity_type` enum expandable  
- Attachment-ready activity/note ids  
- Lead scoring fields nullable / reserved  
- Import job table optional for async large CSVs later  

### Implementation order (locked)

| Phase | Work |
|-------|------|
| **A** | Audit + `AUDIT.md` ← **this document** |
| B | Prisma schema + migration |
| C | Nest APIs + auth |
| D | Institutions UI |
| E | Contacts |
| F | Leads + pipeline |
| G | Activities + timeline |
| H | Follow-ups |
| I | CSV import + dedupe |
| J | Partnership dashboard |
| K | Tests |
| L | `CRM_README.md` |

After each phase: build, test, confirm existing Growth OS modules still work.

---

## Risks / Constraints

1. **Neon / Vercel:** Prefer sequential Prisma writes (or WebSocket Neon adapter already in use); avoid interactive `$transaction` batches that historically broke HTTP mode.  
2. **Arabic CSV / names:** Support UTF-8; reuse i18n patterns; do not invent missing data.  
3. **No fake production schools:** Dev seed only as `DEMO - Institution 00N`.  
4. **Kanban drag-drop:** Use Angular CDK only if it stays aligned with Material/shell; otherwise table + status actions first.  
5. **Bundle size:** Web already near Material budget warnings; keep CRM routes lazy-loaded.

---

## Next Step

**Phase B:** Design and apply Prisma schema + migration for Partnership CRM entities and enums, without shipping UI yet.

No CRM code or migrations were added in Phase A.
