# Rootaca Partnership CRM — API (Phase C)

Base path: `/api/partnerships`  
Auth: JWT Bearer (existing Growth OS auth).  
Pagination (project standard): `{ items, total, page, pageSize, pageCount }`

---

## Roles

| Role | Access |
|------|--------|
| ADMIN | Full CRM including soft-delete / restore / source delete |
| MENTOR | Read + create/update (editor parity with Growth OS) |
| COUNSELOR | Read + create/update |

Guards: existing global `JwtAuthGuard` + `@Roles(...)`.

Actor ids (`createdById`, `performedById`, `deletedById`) come from JWT only — never from request body.

---

## Institutions

| Method | Path | Notes |
|--------|------|--------|
| GET | `/partnerships/institutions` | Filters + search + pagination; excludes soft-deleted unless `includeDeleted=true`. List items include CRM enrichment fields (see below). |
| GET | `/partnerships/institutions/:id` | |
| POST | `/partnerships/institutions` | May include `potentialDuplicates[]` warning |
| PATCH | `/partnerships/institutions/:id` | Empty overwrite skipped unless `allowClear` |
| DELETE | `/partnerships/institutions/:id` | Soft delete only (ADMIN) |
| POST | `/partnerships/institutions/:id/restore` | ADMIN |

### List query params

`page`, `pageSize`, `search`, `sortBy` (whitelist), `sortOrder`  
Filters: `status`, `institutionType`, `institutionCategory`, `curriculum`, `educationLevel`, `governorate`, `city`, `leadPriority`  
Tech: `hasCoding`, `hasRobotics`, `hasStem`, `hasAi`, `hasTechClub`, `hasAfterSchool`, `hasSummerCamp`, `hasMakerspace`  
Presence: `hasEmail`, `hasPhone`, `hasWebsite`, `hasDecisionMaker`  
`includeDeleted`

### List item enrichment (Phase D.1)

Each item in `GET /partnerships/institutions` also returns:

| Field | Type | Definition |
|-------|------|------------|
| `primaryContact` | object \| null | Single selected contact (see rule below) |
| `lastActivityAt` | ISO datetime \| null | `MAX(PartnershipActivity.activityDate)` for the institution |
| `nextFollowUpAt` | ISO date (`YYYY-MM-DD`) \| null | `MIN(dueDate)` among follow-ups with status `PENDING` (includes overdue) |
| `openFollowUpsCount` | number | Count of follow-ups with status `PENDING` |
| `activeLeadsCount` | number | Count of leads whose status is **not** in `PARTNER`, `NOT_INTERESTED`, `NO_RESPONSE`, `LOST` |

`primaryContact` shape when present: `{ id, name, jobTitle, email, phone, mobile, whatsapp }`.

**Primary contact selection (deterministic):**

1. Prefer contacts with `isPrimary === true`.
2. Among ties (or when none are primary), choose the earliest `createdAt`.
3. If the institution has no contacts → `null`.

Implementation loads page institutions first, then runs a **fixed** set of batched queries (`contacts` ordered by the rule above + `groupBy` for activities / follow-ups / leads) scoped to the current page IDs — not N+1 per row.

Sorting by `lastActivityAt` / `nextFollowUpAt` is **not** exposed in `sortBy` (existing column whitelist unchanged).

### Create body (minimum)

`name` required. Optional emails/URLs/enums validated. Normalized fields computed server-side.

---

## CSV Import (Phase E)

See **`PARTNERSHIP_IMPORT.md`** for full rules.

| Method | Path | Roles |
|--------|------|--------|
| POST | `/partnerships/import/preview` | WRITE (multipart CSV) |
| POST | `/partnerships/import/jobs/:id/remap` | WRITE |
| GET | `/partnerships/import/jobs/:id` | READ |
| GET | `/partnerships/import/jobs/:id/rows` | READ |
| PATCH | `/partnerships/import/jobs/:id/decisions` | WRITE |
| POST | `/partnerships/import/jobs/:id/execute` | WRITE |
| GET | `/partnerships/import/history` | READ |
| GET | `/partnerships/import/history/:id` | READ |

Staged jobs use `PartnershipImportJob` + `PartnershipImportRow`. File bytes are not retained.

---

## Research Engine (Phase F / F.1 / Overpass)

See **`PARTNERSHIP_RESEARCH.md`**.

HYBRID default: FREE OpenStreetMap/Overpass discovery + optional Serper WEB_SEARCH enrichment. OVERPASS needs no API key. WEB_SEARCH runs when `RESEARCH_DISCOVERY_API_KEY` is set. Never invents schools. Reuses Phase E dedupe on CRM promotion. Provider status includes `overpass` and `serper` blocks (never API keys).

| Method | Path | Roles |
|--------|------|--------|
| GET | `/partnerships/research/dashboard` | READ |
| GET | `/partnerships/research/providers/status` | READ |
| POST/GET | `/partnerships/research/jobs` | WRITE / READ |
| GET | `/partnerships/research/jobs/:id` | READ |
| POST | `/partnerships/research/jobs/:id/run` | WRITE |
| POST | `/partnerships/research/jobs/:id/cancel` | ADMIN |
| POST/GET | `/partnerships/research/candidates` | WRITE / READ |
| GET/PATCH | `/partnerships/research/candidates/:id` | READ / WRITE |
| POST | `/partnerships/research/candidates/:id/verify\|reject\|duplicate\|import` | WRITE |

---

## Contacts

| Method | Path |
|--------|------|
| GET | `/partnerships/contacts` |
| GET | `/partnerships/contacts/:id` |
| POST | `/partnerships/contacts` |
| PATCH | `/partnerships/contacts/:id` |
| DELETE | `/partnerships/contacts/:id` |
| GET | `/partnerships/institutions/:institutionId/contacts` |

Filters: `institutionId`, `jobTitle`, `isDecisionMaker`, `isPrimary`, `hasEmail`, `hasPhone`, `search`  
Institution must exist and not be soft-deleted. Contact must belong to institution for lead linking.

---

## Leads

| Method | Path |
|--------|------|
| GET | `/partnerships/leads` |
| GET | `/partnerships/leads/:id` |
| POST | `/partnerships/leads` |
| PATCH | `/partnerships/leads/:id` |

`status` uses **PartnershipLeadStatus**. Soft-deleted institutions excluded from lists.

### Status change side effects

Only when `status` actually changes:

1. Update lead  
2. Create `PartnershipActivity` (`NOTE`, subject `Lead status changed`)  
3. Create audit `STATUS_CHANGED` with metadata `{ from, to }`

---

## Activities

| Method | Path |
|--------|------|
| GET | `/partnerships/activities` |
| POST | `/partnerships/activities` |
| GET | `/partnerships/institutions/:institutionId/activities` |

Filters: `institutionId`, `contactId`, `leadId`, `activityType`, `dateFrom`, `dateTo`  
Default sort: `activityDate` desc.

---

## Follow-ups

| Method | Path |
|--------|------|
| GET | `/partnerships/followups` |
| POST | `/partnerships/followups` |
| PATCH | `/partnerships/followups/:id` |
| GET | `/partnerships/institutions/:institutionId/followups` |

Filters: `status`, `priority`, `assignedToId`, `dueDate`, `overdue`, `institutionId`  
Complete via `complete: true` or `status: COMPLETED` → sets `completedAt`, activity, audit.

---

## Notes

| Method | Path |
|--------|------|
| GET | `/partnerships/institutions/:institutionId/notes` |
| POST | `/partnerships/institutions/:institutionId/notes` |
| PATCH | `/partnerships/notes/:id` |
| DELETE | `/partnerships/notes/:id` |

---

## Sources

| Method | Path |
|--------|------|
| GET | `/partnerships/sources` |
| POST | `/partnerships/sources` |
| PATCH | `/partnerships/sources/:id` |
| DELETE | `/partnerships/sources/:id` | ADMIN; **409** if referenced |

---

## Timeline

| Method | Path |
|--------|------|
| GET | `/partnerships/institutions/:id/timeline` |

Unified newest-first items:

```json
{
  "items": [
    {
      "id": "...",
      "type": "ACTIVITY_PHONE_CALL | FOLLOW_UP_PENDING | NOTE | LEAD_STATUS_CHANGED | AUDIT_…",
      "date": "ISO",
      "title": "...",
      "description": "...",
      "createdBy": "Display Name",
      "metadata": {}
    }
  ]
}
```

---

## Dashboard

| Method | Path |
|--------|------|
| GET | `/partnerships/dashboard` |

Aggregations via `count` / `groupBy` (excludes soft-deleted institutions):

- totals + pipeline buckets (`newLeads`, `qualifiedLeads`, … `partners`, `noResponse`)
- `meetings` = MEETING_SCHEDULED + MEETING_DONE
- `followUpsDueToday`, `overdueFollowUps`
- `institutionsByGovernorate`, `institutionsByType`, `leadsByStatus`, `leadsByPriority`

---

## Errors

| Code | When |
|------|------|
| 400 | Validation, contact/lead institution mismatch, empty name |
| 401 | Missing/invalid JWT |
| 403 | Role not allowed |
| 404 | Entity not found / soft-deleted institution |
| 409 | Source delete while referenced |

---

## Duplicate detection

Create/update institution returns optional `potentialDuplicates` (warning only — not rejected).  
Matching: normalized name, phone, website domain, name+city.

---

## Module layout

```text
apps/api/src/partnerships/
  partnerships.module.ts
  common/
  institutions/
  contacts/
  leads/
  activities/
  followups/
  notes/
  sources/
  timeline/
  dashboard/
```
