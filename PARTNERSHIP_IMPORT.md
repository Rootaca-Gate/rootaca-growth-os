# Rootaca Partnership CRM — CSV Import (Phase E)

## Purpose

Import large CSV datasets of Egyptian schools / education centers into the Partnerships CRM **without** blindly inserting rows.

Workflow:

```text
CSV Upload → Parse → Column Mapping → Validate → Normalize → Dedupe
→ Preview / Decisions → Execute (batched) → Result → Audit / History
```

Does **not** create a `PartnershipLead` per imported institution.

Does **not** scrape, enrich, email, WhatsApp, or use AI.

---

## Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max file size | **25 MB** | Keeps multipart memory upload safe for Nest + Neon |
| Max rows | **10,000** | MVP dataset size without long-running jobs |
| Max columns | **80** | Guards malformed / spreadsheet exports |
| Execute batch size | **50** | Short transactions; avoids one huge TX |
| Lookup chunk size | **500** | Batched `IN (...)` duplicate lookups |
| Preview TTL | **48 hours** | Staged jobs expire; re-upload required |

CSV only (`.csv`), UTF-8 with BOM support, comma-separated, quoted fields via `csv-parse`.

---

## Endpoints

Base: `/api/partnerships/import`  
Auth: JWT. Preview/execute/decisions/remap = **CRM write**. History/read = **CRM read**.

| Method | Path | Notes |
|--------|------|--------|
| POST | `/partnerships/import/preview` | multipart `file` + optional `mapping` JSON string |
| POST | `/partnerships/import/jobs/:id/remap` | `{ mapping }` re-validate + re-dedupe |
| GET | `/partnerships/import/jobs/:id` | Preview + filtered rows |
| GET | `/partnerships/import/jobs/:id/rows` | Paginated staged rows |
| PATCH | `/partnerships/import/jobs/:id/decisions` | Per-row + bulk `SKIP_ALL_EXACT` / `IMPORT_ALL_NEW` |
| POST | `/partnerships/import/jobs/:id/execute` | Apply decisions; re-checks duplicates |
| GET | `/partnerships/import/history` | Job list |
| GET | `/partnerships/import/history/:id` | Job detail |

Uploaded file bytes are **not** stored after parse — only staged row JSON in `PartnershipImportJob` / `PartnershipImportRow`.

---

## Required fields

- **`name`** (min 2 characters) — only hard required field (matches domain create rules)

---

## Supported CRM fields & aliases

See `apps/api/src/partnerships/import/mapping/field-aliases.ts`.

Highlights:

| Concept | CRM field | Example aliases |
|---------|-----------|-----------------|
| Name | `name` | school, school_name, institution, name |
| English / Arabic | `englishName` / `arabicName` | name_en, name_ar |
| Location | `governorate`, `city`, `district`, `fullAddress` | address → fullAddress |
| Contact | `contactName`, `contactJobTitle`, `contactEmail` | principal, email |
| Institution emails | `generalEmail`, `admissionsEmail` | |
| Phones | `phone`, `mobile`, `whatsapp` | telephone, tel, mobile_number |
| Website / social | `website`, `facebook`, … `googleMapsUrl` | |
| Tech flags | `hasCoding`, `hasRobotics`, … | coding, programming, robotics, stem, ai, summer_program |
| Source | `sourceName`, `sourceUrl` | source, source_url (stored only — never fetched) |
| Priority / notes | `leadPriority`, `notes` | description → notes |

### Unsupported in Phase E

| CSV concept | Reason |
|-------------|--------|
| `country` | No schema field |
| Multi-contact rows | Single optional contact per row only |
| Fuzzy AI matching | Deterministic rules only |

---

## Normalization

Source of truth: `apps/api/src/partnerships/common/partnership.normalize.ts`

| Helper | Behavior |
|--------|----------|
| `normalizeName` | trim, collapse spaces, NFKC, lowercase, strip punctuation |
| `normalizePhone` | digits; keep leading `+` |
| `normalizeEmail` | trim + lowercase |
| `normalizeWebsiteDomain` | hostname without protocol/www/path |
| `sanitizeSpreadsheetValue` | strips leading `=` / `@` / tab (keeps `+` phones) |

Angular does **not** re-implement these rules.

---

## Duplicate detection

Signals (against DB **and** earlier CSV rows):

| Signal | Confidence |
|--------|------------|
| Same `normalizedWebsiteDomain` | **EXACT** |
| Same `normalizedPhone` (≥ 8 digits) | **EXACT** |
| Same `normalizedName` + same city | **EXACT** |
| Same `normalizedName` (± same governorate) | **POSSIBLE** |
| Same email | **POSSIBLE** |

Default decisions:

| Situation | Default |
|-----------|---------|
| EXACT / CSV duplicate | `SKIP` |
| POSSIBLE | `SKIP` (needs review) |
| NONE + valid | `IMPORT` |
| Invalid | `SKIP` only |

User may choose: `SKIP` | `MERGE` | `IMPORT_ANYWAY` | `IMPORT`.

**No silent merge. No “merge all” bulk action.**

---

## Merge behavior

Existing institution remains canonical.

- Keep existing non-empty values
- Fill only empty fields from CSV
- Conflicting values → keep existing
- Notes → append as new `PartnershipNote` (`[Imported] …`), never overwrite `notes` string blindly on merge path for historical notes list
- Contacts → create only if email/phone not already present
- Source → set only if existing `sourceId` is empty
- Branch/`parentInstitutionId` → not auto-inferred (ambiguous → leave for manual review)

## Import anyway

Creates a **new** institution; does not modify the matched record.

## Execute safety

Duplicates are **re-checked** at execute time. If an EXACT DB match appears for an `IMPORT` decision, the row is skipped (protect existing).

---

## Audit

| Event | When |
|-------|------|
| `IMPORT_STARTED` | Preview job created |
| `IMPORT_COMPLETED` | Execute finished (summary counts in metadata) |
| `IMPORT_FAILED` | Execute aborted |
| `INSTITUTION_CREATED` / `INSTITUTION_MERGED` | Per successful row |
| `CONTACT_CREATED` / `NOTE_CREATED` / `SOURCE_CREATED` | As applicable |

---

## UI

| Route | Page |
|-------|------|
| `/partnerships/import` | Wizard: upload → map → review → confirm → result |
| `/partnerships/import/history` | Job history |
| `/partnerships/import/history/:id` | Job detail |

Nav: **PARTNERSHIPS → Import**.

---

## Example CSV

`apps/api/examples/partnership-import-example.csv` — for documentation/testing only; not auto-imported.

---

## Schema

Additive migration: `20260923003000_partnership_csv_import`

- `PartnershipImportJob`
- `PartnershipImportRow`
- Audit actions: `IMPORT_STARTED`, `IMPORT_FAILED`, `INSTITUTION_MERGED`

Existing normalized field indexes reused (no extra indexes required).

---

## Dependency

`csv-parse` (API workspace) — small RFC4180 parser; project had no CSV library.

---

## Limitations

- Sync execute (no distributed/resumable workers)
- Preview rows stored in DB (suitable for ≤10k rows MVP)
- No fuzzy string similarity beyond exact normalized equality
- No multi-contact CSV syntax
- Country / free-form description beyond `notes` unsupported
- Formula sanitization on ingest; spreadsheet export escaping is out of scope
