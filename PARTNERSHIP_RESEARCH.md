# Rootaca Partnership CRM — Research Engine (Phase F)

## Purpose

Controlled **public institutional discovery** for Egyptian education organizations relevant to ROOTACA partnerships.

This is **research coverage**, not a claim that “all schools in Egypt” were found.

## Architecture

```text
                    DISCOVERY
                       │
         ┌─────────────┴─────────────┐
         │                           │
  OPENSTREETMAP / OVERPASS      SERPER WEB SEARCH
       (FREE)                   (existing)
         │                           │
         └─────────────┬─────────────┘
                       ↓
                 CANDIDATE → NORMALIZE → DEDUPLICATE → ENRICH → VERIFY → HUMAN REVIEW → CRM
```

Module: `apps/api/src/partnerships/research/`

Models:

- `PartnershipResearchJob` (`discoveryMode`: `OVERPASS` | `WEB_SEARCH` | `HYBRID`)
- `PartnershipResearchCandidate` (optional `latitude` / `longitude` / `osmType` / `osmId` / `osmUrl`)
- `PartnershipResearchEvidence` (field-level provenance)

## External discovery decision

### Discovery providers

| Provider | Status | API key |
|----------|--------|---------|
| `MANUAL` | Always available — human-entered public candidates | No |
| `OPENSTREETMAP_OVERPASS` | **FREE** structured `amenity=school` discovery via Overpass | **No** |
| `WEB_SEARCH` (Serper / Brave) | HTTP search for discovery and/or missing-field enrichment | Yes |
| `HYBRID` (recommended default) | Overpass discovery → normalize/dedupe → Serper enrichment for missing fields | Serper optional |

**Attribution:** OpenStreetMap data © OpenStreetMap contributors (ODbL). Quality depends on what mappers have contributed.

**Do not use public Nominatim for bulk POI downloads** — Overpass is used for structured school discovery; Nominatim is not used for grid crawling.

### Environment (backend only — never expose to Angular)

```env
RESEARCH_DISCOVERY_PROVIDER=HYBRID
RESEARCH_DISCOVERY_ENGINE=serper
RESEARCH_DISCOVERY_API_KEY=
RESEARCH_DISCOVERY_API_URL=https://google.serper.dev/search
RESEARCH_OVERPASS_ENABLED=true
RESEARCH_OVERPASS_API_URL=https://overpass-api.de/api/interpreter
RESEARCH_OVERPASS_USER_AGENT=ROOTACA-Research/1.0 (+https://rootaca.com)
RESEARCH_OVERPASS_TIMEOUT_MS=30000
RESEARCH_OVERPASS_MAX_RESULTS=1000
RESEARCH_OVERPASS_CONCURRENCY=1
RESEARCH_ENRICHMENT_ENABLED=false
```

### Security / limits

- No fake data, CAPTCHA bypass, proxy rotation, or AI
- Overpass: concurrency 1, timeout, retry/backoff, query cache — respect public instance limits
- Secrets never in API responses, logs of headers, audit, or evidence
- Website enrichment (optional): http(s) only, no localhost/private IPs/metadata
- Human review remains the gate before CRM import
- Derived Maps URLs from coordinates are marked **derived**, not official Google Maps source evidence

## Job lifecycle

`DRAFT → RUNNING → COMPLETED` (or `FAILED` / `CANCELLED` by ADMIN)

Also modeled: `QUEUED`, `PAUSED`.

When WEB_SEARCH runs, candidates are persisted **incrementally**; a mid-job failure keeps already saved candidates.

## Candidate lifecycle

`DISCOVERED` / `READY_FOR_REVIEW` → `VERIFIED` | `REJECTED` | `DUPLICATE` → `IMPORTED`  
`STALE` when previously verified data exceeds freshness window (180 days helper).

### Verification statuses

| Status | Meaning |
|--------|---------|
| UNVERIFIED | Discovered / insufficient evidence |
| PARTIALLY_VERIFIED | Identity + some location/contact |
| VERIFIED | Human-confirmed against public criteria (not a correctness guarantee) |
| STALE | Needs re-check |

### Duplicate statuses

Reuses Phase E deterministic signals (`detectDuplicates`):

- EXACT: website domain · phone (≥8) · name+city  
- POSSIBLE: name · email · name+governorate  

Checked against CRM institutions **and** other candidates.

## Query generation

Deterministic templates (EN/AR) from geography + type + curriculum + technology flags.  
No AI. Capped by `maxQueries` (default 24, max 48).

Governorate target list: 26 Egyptian governorates in `research.constants.ts`.

## CRM promotion

`POST .../candidates/:id/import`:

1. Re-runs Phase E dedupe against institutions  
2. Blocks on EXACT CRM match (returns `matchedInstitutionId`)  
3. Creates `PartnershipInstitution` (+ optional public contact, note, source)  
4. Marks candidate `IMPORTED`  
5. Does **not** create a Lead  

## Permissions

| Action | Roles |
|--------|--------|
| Read dashboard/jobs/candidates | CRM_READ |
| Create/run jobs, manage candidates, import | CRM_WRITE |
| Cancel jobs | CRM_ADMIN |

## Rate limits (MVP)

- maxResultsPerQuery ≤ 50  
- maxQueries ≤ 48  
- maxCandidates ≤ 1000 (default 200)  

No proxy rotation / stealth scraping.

## API

| Method | Path |
|--------|------|
| GET | `/partnerships/research/dashboard` |
| GET | `/partnerships/research/providers/status` |
| POST/GET | `/partnerships/research/jobs` |
| GET | `/partnerships/research/jobs/:id` |
| POST | `/partnerships/research/jobs/:id/run` |
| POST | `/partnerships/research/jobs/:id/cancel` |
| POST/GET | `/partnerships/research/candidates` |
| GET/PATCH | `/partnerships/research/candidates/:id` |
| POST | `/partnerships/research/candidates/:id/verify\|reject\|duplicate\|import` |

## UI

| Route | Screen |
|-------|--------|
| `/partnerships/research` | Dashboard + jobs + candidate queue + provider status |
| `/partnerships/research/jobs/:id` | Job coverage + planned queries + execution metrics |
| `/partnerships/research/candidates/:id` | Review / verify / import |

Nav: **PARTNERSHIPS → Research**

## Limitations

- Automated discovery requires a configured `RESEARCH_DISCOVERY_API_KEY`  
- Without credentials: MANUAL path only (no fake results)  
- Article/directory search hits are **discovery sources**, not institutions — page content is fetched (SSRF-safe) and split into multiple school candidates  
- No HTML retention / uncontrolled crawler  
- No AI extraction  
- No email/WhatsApp outreach  
- Sync job “run” only (no distributed workers)  

## Example job (documentation only)

```text
Name: Giza — International Schools — Technology
Governorate: Giza
City: 6th of October
Type: SCHOOL
Technology: coding, robotics, STEM, AI
Language: BOTH
```

Do not execute automatically.
