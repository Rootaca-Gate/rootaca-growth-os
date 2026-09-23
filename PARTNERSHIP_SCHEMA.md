# Rootaca Partnership CRM — Data Model

**Migrations:**

1. `20260922224123_partnership_crm` — initial CRM tables  
2. `20260922225400_partnership_crm_refine` — Phase B.1 soft delete + lead status split  
3. `20260923003000_partnership_csv_import` — Phase E import jobs + rows + audit actions  
4. `20260923010000_partnership_research` — Phase F research jobs / candidates / evidence  

**Status:** Schema + Nest APIs + Angular CRM UI + CSV import + Research engine. Overpass (FREE OSM) + optional WEB_SEARCH (Serper). Additive fields: candidate `latitude`/`longitude`/`osm*`, job `discoveryMode`, source type `OSM`.

---

## Design principles

| Principle | Choice |
|-----------|--------|
| ID | `uuid` (`@db.Uuid`) |
| Timestamps | `createdAt` / `updatedAt` |
| Soft delete | Institutions only: `deletedAt` + `deletedById` — API never hard-deletes |
| Institution vs Lead status | **Separate enums** — lifecycle vs opportunity pipeline |
| Normalization | Backend utilities on create/update (not frontend) |
| History safety | **RESTRICT** on institution parents — timeline preserved |
| Branches | `parentInstitutionId` + `branchName` |
| Users | FKs to `User` for owner / createdBy / assignedTo / deletedBy / audit |

---

## Soft delete (institutions)

| Field | Behavior |
|-------|----------|
| `deletedAt` | Set on soft delete; null when active / restored |
| `deletedById` | Actor user id |

Default list / search / dashboard / lead lists exclude `deletedAt IS NOT NULL`.  
Pass `includeDeleted=true` on institution list for Admin review.  
Restore: `POST /partnerships/institutions/:id/restore`.  
Activities, notes, follow-ups are **not** cascade-deleted.

---

## Status separation

### PartnershipInstitutionStatus (institution lifecycle)

`PROSPECT` | `ACTIVE` | `INACTIVE` | `DO_NOT_CONTACT` | `ARCHIVED`  
Default: `PROSPECT`

### PartnershipLeadStatus (opportunity pipeline)

`NEW` | `QUALIFIED` | `CONTACTED` | `REPLIED` | `MEETING_SCHEDULED` | `MEETING_DONE` | `PROPOSAL_SENT` | `NEGOTIATION` | `PARTNER` | `NOT_INTERESTED` | `NO_RESPONSE` | `LOST`  
Default: `NEW`

---

## Normalization rules (service layer)

Module: `apps/api/src/partnerships/common/partnership.normalize.ts`

| Helper | Behavior |
|--------|----------|
| `normalizeName` | trim, collapse spaces, NFKC, lowercase, strip most punctuation |
| `normalizePhone` | digits; keep leading `+`; no invented country codes |
| `normalizeEmail` | trim + lowercase |
| `normalizeWebsiteDomain` | hostname without protocol/www/path |

Applied on institution/contact create & update. Reused by CSV Import (`sanitizeSpreadsheetValue` also strips formula prefixes).

PATCH policy: empty/null values do **not** overwrite populated fields unless `allowClear: true`.

---

## Import staging (Phase E)

```text
PartnershipImportJob
  └── PartnershipImportRow (staged mapped/normalized rows + decisions/results)
```

See `PARTNERSHIP_IMPORT.md`.

---

## Research (Phase F)

```text
PartnershipResearchJob (discoveryMode: OVERPASS | WEB_SEARCH | HYBRID)
  └── PartnershipResearchCandidate (+ lat/lon/osmType/osmId/osmUrl, sourceType OSM)
        └── PartnershipResearchEvidence (field-level)
```

Automated discovery: Overpass (no API key) and/or WEB_SEARCH when configured. See `PARTNERSHIP_RESEARCH.md`.

---

## Models (summary)

```text
PartnershipSource
       │
       ▼
PartnershipInstitution (soft delete) ── parentInstitutionId
       ├── PartnershipContact
       ├── PartnershipLead (PartnershipLeadStatus)
       ├── PartnershipActivity
       ├── PartnershipFollowUp
       └── PartnershipNote

PartnershipAuditEvent
```

Dedupe columns on institution: `normalizedName`, `normalizedPhone`, `normalizedWebsiteDomain` (indexed, **not** unique).

---

## Delete / cascade policy

| Relation | onDelete |
|----------|----------|
| Institution children | Restrict |
| Soft delete | Application-level only |
| Optional contact/lead on activities | SetNull |
| Source delete | App returns 409 if referenced |

---

## Phase C readiness

Nest module: `apps/api/src/partnerships/` — see `PARTNERSHIP_API.md`.
