# Rootaca Partnership CRM — Angular UI (Phase D + E)

## Routes

| Path | Page |
|------|------|
| `/partnerships` | Partnership dashboard |
| `/partnerships/institutions` | Institutions list |
| `/partnerships/institutions/new` | Create institution |
| `/partnerships/institutions/:id` | Institution CRM profile |
| `/partnerships/institutions/:id/edit` | Edit institution |
| `/partnerships/contacts` | Contacts list |
| `/partnerships/leads` | Leads table + board |
| `/partnerships/leads/:id` | Lead details + status change |
| `/partnerships/follow-ups` | Follow-ups by bucket |
| `/partnerships/activities` | Activities feed |
| `/partnerships/import` | CSV import wizard |
| `/partnerships/import/history` | Import history |
| `/partnerships/import/history/:id` | Import job detail |
| `/partnerships/research` | Research dashboard + queue + provider configured/not-configured status |
| `/partnerships/research/jobs/:id` | Research job coverage + metrics (`discoveryMode`) |
| `/partnerships/research/candidates/:id` | Candidate review (discovery vs evidence vs official website) |

All routes are lazy-loaded under the authenticated `AppShell`.

## Navigation

`APP_NAV` section **PARTNERSHIPS** includes Dashboard, Institutions, Contacts, Leads, Follow-ups, Activities, Import, **Research**.

## Feature folder

```text
apps/web/src/app/features/partnerships/
  partnership.models.ts
  partnership.labels.ts
  partnership.permissions.ts
  partnership.util.ts
  partnerships.api.ts
  partnerships.api.spec.ts
  institution-form.*
  institutions-list.page.*
  institution-create.page.ts
  institution-edit.page.ts
  institution-details.page.*
  contacts-list.page.ts
  leads-list.page.ts
  lead-details.page.ts
  activities-list.page.ts
  followups-list.page.ts
  partnership-dashboard.page.*
  import/
    import.page.*
    import-history.page.ts
    import-history-detail.page.ts
  partnerships-import.api.spec.ts
```

## API integration

`PartnershipsApi` (`providedIn: 'root'`) wraps `/api/partnerships/*`.

Pagination uses existing shape: `items`, `total`, `page`, `pageSize`, `pageCount`.

Search/filters are server-side. Institution search is debounced (300ms).

### Institutions list (Phase D.1)

The institutions table reads CRM columns **only** from `GET /partnerships/institutions` list items:

| Column | Source |
|--------|--------|
| Primary contact | `primaryContact.name` |
| Email / Phone | `primaryContact.email` / `primaryContact.phone` (fallback mobile → whatsapp) |
| Last activity | `lastActivityAt` (ISO → `YYYY-MM-DD`) |
| Next follow-up | `nextFollowUpAt` |

Missing values render as `—`. No per-row API calls for contacts, activities, or follow-ups.

### CSV import (Phase E)

Wizard at `/partnerships/import` uses multipart preview + staged job decisions. Normalization and dedupe run on the API only. See `PARTNERSHIP_IMPORT.md`.

## Permissions (UI)

| Capability | Roles |
|------------|--------|
| Read | ADMIN, MENTOR, COUNSELOR |
| Write (create/update/import) | ADMIN, MENTOR, COUNSELOR |
| Soft delete / restore | ADMIN only |

Backend remains authoritative. JWT handling unchanged (`AuthService`).

## UX decisions

- Reused Rootaca shared UI: `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `SectionHeader`, `ra-card`, `ra-filters`, `ra-table-wrap`.
- Institution create/edit use dedicated pages (same pattern as Students).
- Institution profile uses inline panels for Add Contact / Activity / Follow-up / Note / Lead (no separate design system).
- Lead board view is a lightweight column layout (no drag-drop library).
- Status change UI is controlled select only; frontend does **not** create duplicate status activities.
- Arabic/RTL via existing `DirectionService` + `TPipe`; names use `dir="auto"` where helpful.
- Empty CRM states do not invent fake schools.

## Extending the CRM

1. Add API method in `partnerships.api.ts`.
2. Extend models in `partnership.models.ts`.
3. Add i18n keys under `partnerships` in `messages.ts` (EN + AR).
4. Add route + nav item if needed.
5. Prefer feature-local signals; do not introduce NgRx.

## Out of scope (later phases)

Email, WhatsApp, Proposal management, AI scoring, automated web discovery provider integration.
