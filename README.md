# ROOTACA Growth OS

Phase 10 is a live operational dashboard. Home (`/`) reads `GET /api/dashboard` and shows current student, session, skill, KPI, project, roadmap, and review totals. Nothing is hardcoded and nothing is stored as a dashboard row.

## Workspace

```text
apps/api    NestJS API (TypeScript, Prisma, PostgreSQL, JWT, Swagger, Pino, Jest)
apps/web    Angular 20+ web app (Material, standalone components, signals, RTL/LTR)
```

## Prerequisites

- Node.js 20.19 or later (Node 24 is supported)
- npm 11+
- Docker Desktop (for PostgreSQL)

## Quick start

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

3. Install dependencies from the repository root:

   ```bash
   npm install
   ```

4. Run migrations and seed development users plus demo students:

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. Start the API:

   ```bash
   npm run dev:api
   ```

6. Start the web app in another terminal:

   ```bash
   npm run dev:web
   ```

## Local URLs

| Service      | URL                              |
| ------------ | -------------------------------- |
| Web app      | http://localhost:4200            |
| Login        | http://localhost:4200/login      |
| API          | http://localhost:3000/api        |
| Health check | http://localhost:3000/api/health |
| Swagger UI   | http://localhost:3000/api/docs   |
| PostgreSQL   | localhost:5432                   |

The Angular dev server proxies `/api` to the NestJS API. In Swagger, click **Authorize** and paste the JWT access token from `/auth/login`.

## Development seed users

These accounts are created by `npm run prisma:seed`. They are **development-only** and must never be used in production.

| Email                   | Role      | Password            |
| ----------------------- | --------- | ------------------- |
| `admin@rootaca.com`     | ADMIN     | `DevAdmin#2026`     |
| `mentor@rootaca.com`    | MENTOR    | `DevMentor#2026`    |
| `counselor@rootaca.com` | COUNSELOR | `DevCounselor#2026` |

Password policy: at least 10 characters, with uppercase, lowercase, number, and symbol.

Seed refuses to run when `NODE_ENV=production`.

## Auth API

| Method | Path                | Auth                       |
| ------ | ------------------- | -------------------------- |
| `POST` | `/api/auth/login`   | Public                     |
| `POST` | `/api/auth/refresh` | Refresh token body         |
| `POST` | `/api/auth/logout`  | Refresh token body         |
| `GET`  | `/api/auth/me`      | Bearer access token        |
| `GET`  | `/api/admin`        | Bearer token, `ADMIN` role |

Access tokens expire in 15 minutes. Refresh tokens expire in 7 days, are stored hashed, rotate on use, and are revoked on logout. Reuse of a revoked refresh token revokes the rest of that user's refresh tokens.

Roles: `ADMIN`, `MENTOR`, `COUNSELOR`.

## Students API

| Method  | Path                       | Auth                                                                                                |
| ------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET`   | `/api/students`            | Bearer token. Query: `search`, `status`, `level`, `path`, `page`, `pageSize`, `sortBy`, `sortOrder` |
| `GET`   | `/api/students/:id`        | Bearer token                                                                                        |
| `POST`  | `/api/students`            | Bearer token                                                                                        |
| `PUT`   | `/api/students/:id`        | Bearer token                                                                                        |
| `PATCH` | `/api/students/:id/status` | Bearer token                                                                                        |

Student profile tabs for Skills, Roadmap, KPIs, Projects, Progress, and Reports show the skill matrix, path recommendation, roadmap progress, KPI dashboard, educational project progress, review history with growth charts, and a live progress-report preview with PDF generate/download. Open `/students/:id/roadmap`, `/students/:id/kpis`, `/students/:id/projects`, `/students/:id/progress`, or `/students/:id/report` for the full pages. Admins configure KPI definitions at `/kpis` and educational projects at `/projects`. Mentors and admins can record KPI actuals, project milestones, and progress reviews. Remaining tabs stay placeholders. The signed-in home page is the live Growth OS dashboard.

## Orientation API

| Method  | Path                                     | Auth                                                                         |
| ------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `POST`  | `/api/orientation-sessions`              | Bearer token. Body: `{ studentId }`. Returns the open session if one exists. |
| `GET`   | `/api/orientation-sessions`              | Bearer token. Query: `studentId`                                             |
| `GET`   | `/api/orientation-sessions/:id`          | Bearer token                                                                 |
| `POST`  | `/api/orientation-sessions/:id/start`    | Bearer token                                                                 |
| `POST`  | `/api/orientation-sessions/:id/pause`    | Bearer token                                                                 |
| `POST`  | `/api/orientation-sessions/:id/resume`   | Bearer token                                                                 |
| `PATCH` | `/api/orientation-sessions/:id`          | Bearer token. Save notes, stage, optional answers                            |
| `PUT`   | `/api/orientation-sessions/:id/answers`  | Bearer token                                                                 |
| `POST`  | `/api/orientation-sessions/:id/complete` | Bearer token. Allowed after 20 minutes                                       |
| `GET`   | `/api/orientation-sessions/:id/result`   | Bearer token                                                                 |

Category weights: Programming Fundamentals 25%, Problem Solving 30%, Technical Knowledge 15%, Practical Skills 20%, Communication & Learning 10%. Completing a session calculates level, skills, and a path recommendation.

## Placement API

| Method  | Path                                | Auth                                             |
| ------- | ----------------------------------- | ------------------------------------------------ |
| `GET`   | `/api/levels`                       | Bearer token. Includes `LevelRule` score bands   |
| `GET`   | `/api/skills`                       | Bearer token                                     |
| `GET`   | `/api/learning-paths`               | Bearer token. Includes weighted skills           |
| `GET`   | `/api/students/:id/skills`          | Bearer token                                     |
| `GET`   | `/api/students/:id/placement`       | Bearer token. Latest system and final level/path |
| `PATCH` | `/api/students/:id/placement/level` | Bearer token. Body: `{ levelId, reason }`        |
| `PATCH` | `/api/students/:id/placement/path`  | Bearer token. Body: `{ pathId, reason }`         |

Default level bands (stored as `LevelRule`, not hardcoded at runtime): Explorer 0–29, Beginner 30–49, Foundation 50–69, Intermediate 70–84, Advanced 85–100.

After `POST /api/orientation-sessions/:id/complete`: Assessment Result → Calculate Level → Calculate Skills → Recommend Path → Generate Roadmap from the matching path/level template. Path scoring uses interests (35%), goal (20%), skill alignment (30%), and experience (15%). Overrides keep the system result and write `changedBy`, `reason`, and timestamp on the final result. Changing path or level regenerates the roadmap; mentor edits are kept while path and level stay the same.

## Roadmap API

| Method   | Path                                                      | Auth                                                                    |
| -------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `GET`    | `/api/roadmap-templates`                                  | Bearer token. One template per learning path and level                  |
| `GET`    | `/api/students/:id/roadmap`                               | Bearer token. Generates from the current path/level template if missing |
| `POST`   | `/api/students/:id/roadmap/generate`                      | Bearer token, `ADMIN` or `MENTOR`. Force regenerate from the template   |
| `POST`   | `/api/students/:id/roadmap/phases`                        | Bearer token, `ADMIN` or `MENTOR`                                       |
| `PUT`    | `/api/students/:id/roadmap/phases/reorder`                | Bearer token, `ADMIN` or `MENTOR`. Body: `{ ids }`                      |
| `PATCH`  | `/api/students/:id/roadmap/phases/:phaseId`               | Bearer token, `ADMIN` or `MENTOR`                                       |
| `DELETE` | `/api/students/:id/roadmap/phases/:phaseId`               | Bearer token, `ADMIN` or `MENTOR`                                       |
| `POST`   | `/api/students/:id/roadmap/phases/:phaseId/items`         | Bearer token, `ADMIN` or `MENTOR`                                       |
| `PUT`    | `/api/students/:id/roadmap/phases/:phaseId/items/reorder` | Bearer token, `ADMIN` or `MENTOR`. Body: `{ ids }`                      |
| `PATCH`  | `/api/students/:id/roadmap/items/:itemId`                 | Bearer token, `ADMIN` or `MENTOR`. Dates, status, completion, notes     |
| `DELETE` | `/api/students/:id/roadmap/items/:itemId`                 | Bearer token, `ADMIN` or `MENTOR`                                       |

Item statuses: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`. Overall and phase progress average item completion (completed items count as 100%, not started as 0%). Counselors can view but cannot mutate.

## KPI API

| Method   | Path                                   | Auth                                                                                 |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `GET`    | `/api/kpis`                            | Bearer token. Catalog of KPI definitions                                             |
| `POST`   | `/api/kpis`                            | Bearer token, `ADMIN`. Create a definition                                           |
| `PATCH`  | `/api/kpis/:id`                        | Bearer token, `ADMIN`. Update name, target, unit, frequency, weight, active          |
| `DELETE` | `/api/kpis/:id`                        | Bearer token, `ADMIN`. Soft-deactivate (`active=false`)                              |
| `GET`    | `/api/students/:id/kpis`               | Bearer token. Assigns active KPIs and upserts current weekly and monthly records     |
| `PATCH`  | `/api/students/:id/kpis/:studentKpiId` | Bearer token, `ADMIN` or `MENTOR`. Record actual/target/notes for the current period |

Default KPIs: Coding Problems, Mini Projects, Independent Tasks, Weekly Practice Hours, Project Completion, Problem Solving, Independence.

Each student KPI stores current `actual`, `target`, `progressPercent`, and `status`. Progress is `actual / target` clamped to 0–100. Statuses: `ON_TRACK`, `AT_RISK`, `BEHIND`, `COMPLETED`. Weekly KPIs roll up into the monthly record unless the monthly value was recorded manually. Counselors can view but cannot mutate.

## Educational Projects API

Projects are classroom learning work. Copy that describes client case studies is rejected.

| Method   | Path                                                          | Auth                                                                             |
| -------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET`    | `/api/projects`                                               | Bearer token. Educational project catalog                                        |
| `POST`   | `/api/projects`                                               | Bearer token, `ADMIN`. Create a classroom project                                |
| `GET`    | `/api/projects/:id`                                           | Bearer token. Definition plus student assignments                                |
| `PATCH`  | `/api/projects/:id`                                           | Bearer token, `ADMIN`                                                            |
| `DELETE` | `/api/projects/:id`                                           | Bearer token, `ADMIN`. Soft-deactivate                                           |
| `POST`   | `/api/projects/:id/assign`                                    | Bearer token, `ADMIN` or `MENTOR`. Body: `{ studentId, dueDate?, notes? }`       |
| `GET`    | `/api/students/:id/projects`                                  | Bearer token. Assigned projects and overall progress                             |
| `GET`    | `/api/students/:id/projects/:studentProjectId`                | Bearer token                                                                     |
| `PATCH`  | `/api/students/:id/projects/:studentProjectId`                | Bearer token, `ADMIN` or `MENTOR`. Status, due date, notes                       |
| `PATCH`  | `/api/students/:id/projects/:studentProjectId/milestones/:id` | Bearer token, `ADMIN` or `MENTOR`. Completion, status, due date, mentor feedback |
| `DELETE` | `/api/students/:id/projects/:studentProjectId`                | Bearer token, `ADMIN` or `MENTOR`. Unassign                                      |

Milestones created on every assignment: Planning, UI/UX, Frontend, Backend, Database, Testing, Deployment, Presentation. Each stores completion %, status, due date, and mentor feedback. Overall project progress averages those eight milestones (completed = 100%, not started = 0%). Counselors can view but cannot mutate.

## Progress Reviews API

Mentors record an **Initial Assessment** and **Monthly Review** for each student. Tracked dimensions: Technical Skills, Problem Solving, Projects, Independence, Communication. Each review stores scores 0–100 and snapshots current KPI and classroom-project overall percents. Growth is current score minus the previous review.

| Method   | Path                                     | Auth                                                                         |
| -------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `GET`    | `/api/students/:id/progress`             | Bearer token. History, current/previous/growth, and skill/KPI/project charts |
| `GET`    | `/api/students/:id/progress/reviews`     | Bearer token. Newest first                                                   |
| `POST`   | `/api/students/:id/progress/reviews`     | Bearer token, `ADMIN` or `MENTOR`. Initial assessment or monthly review      |
| `GET`    | `/api/students/:id/progress/reviews/:id` | Bearer token                                                                 |
| `PATCH`  | `/api/students/:id/progress/reviews/:id` | Bearer token, `ADMIN` or `MENTOR`                                            |
| `DELETE` | `/api/students/:id/progress/reviews/:id` | Bearer token, `ADMIN` or `MENTOR`                                            |

One initial assessment per student. Monthly reviews are unique per student and period start (defaults to the UTC month of the review date). Counselors can view but cannot mutate.

## Student Reports API

The progress report is a live composite. Nothing is stored as a report row; each request reads current student, placement, skills, assessment, roadmap, KPIs, classroom projects, and progress reviews.

| Method | Path                           | Auth                                                                                      |
| ------ | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `GET`  | `/api/students/:id/report`     | Bearer token. Query: `locale=en\|ar`. JSON preview for every report section               |
| `GET`  | `/api/students/:id/report.pdf` | Bearer token. Query: `locale=en\|ar`. ROOTACA-branded PDF (inline; download from the app) |

Report sections: Student Information, Current Level, Assessment Score, Skills, Recommended Path, Roadmap, KPIs, Projects, Achievements, Areas for Improvement, Next Goals. Insights are derived from high/low scores, completed work, blocked items, and the latest review `strengths` / `nextFocus`. Arabic PDFs reshape and bidi-reorder text and embed Noto Sans / Noto Sans Arabic.

## Dashboard API

The dashboard is a live composite. Each request reads current students and related records. It does not assign KPIs or generate roadmaps.

| Method | Path             | Auth         |
| ------ | ---------------- | ------------ |
| `GET`  | `/api/dashboard` | Bearer token |

Cards: Total Students, Active Students, Today's Sessions, Pending Assessments, Average Progress, Projects Completed.

Charts: Students by Level, Students by Path, Average Skill Scores, KPI Status, Monthly Progress.

Attention: KPI Below Target, Assessment Pending, No Recent Activity, Roadmap Behind Schedule.

Also returns recent (non-draft) orientation sessions and upcoming draft sessions. Average progress is the mean of each student's latest review `overallScore`. Today's sessions are in-progress/paused sessions plus any session started, completed, or created today (UTC). Pending assessments are students with no completed orientation.

## Environment

Root `.env.example` documents every required variable:

- `DATABASE_URL` — PostgreSQL connection string used by Prisma
- `JWT_SECRET` — access-token signing secret
- `JWT_EXPIRES_IN` — access-token lifetime (`15m`)
- `JWT_REFRESH_EXPIRES_IN` — refresh-token lifetime (`7d`)
- `PORT`, `API_PREFIX`, `CORS_ORIGIN` — HTTP server settings
- `LOG_LEVEL` — Pino log level (`info`, `debug`, `silent`, ...)

## Scripts

| Command                   | Description                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev:api`         | API in watch mode                                                                                                               |
| `npm run dev:web`         | Angular dev server                                                                                                              |
| `npm run build:api`       | Compile the API                                                                                                                 |
| `npm run build:web`       | Production build of the web app                                                                                                 |
| `npm test`                | API Jest tests and web unit tests                                                                                               |
| `npm run lint`            | ESLint for both apps                                                                                                            |
| `npm run format`          | Prettier                                                                                                                        |
| `npm run prisma:validate` | Validate the Prisma schema                                                                                                      |
| `npm run prisma:generate` | Generate Prisma Client                                                                                                          |
| `npm run prisma:migrate`  | Create/apply Prisma migrations                                                                                                  |
| `npm run prisma:seed`     | Seed users, demo students, assessment, placement, roadmaps, KPIs, educational projects, progress reviews, and report-ready data |
| `npm run docker:up`       | Start PostgreSQL                                                                                                                |
| `npm run docker:down`     | Stop PostgreSQL                                                                                                                 |

## API conventions

- Global prefix: `api`
- Global `ValidationPipe` with whitelist, forbid non-whitelisted properties, and implicit conversion
- Global JWT auth guard, with `@Public()` on unauthenticated routes
- Global roles guard; use `@Roles(Role.ADMIN)` (or other roles) on protected handlers
- Global exception filter with a consistent `{ statusCode, timestamp, path, message }` body
- Request logging through `nestjs-pino`
- Passwords hashed with Argon2id

## Frontend conventions

- Standalone components
- Angular Material
- Reactive Forms
- Signals
- Auth interceptor attaches the Bearer access token and retries once after refresh
- Auth guard protects the shell; guest guard sends signed-in users away from `/login`
- Document-level RTL/LTR switching (`en` LTR, `ar` RTL)
