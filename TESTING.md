# Tests

Three levels of tests cover the application: pure front-end logic (Vitest), HTTP
endpoints (Japa) and real browser journeys (Cypress).

Reference numbers as of 2026-07-28: **60 unit tests**, **131 functional tests**,
**14 Cypress tests** spread over 6 files.

## 1. Unit tests (Vitest)

Pure front-end logic, extracted out of the components so it can be tested without a DOM:

| File                                                     | Covers                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`inertia/utils/date.ts`](inertia/utils/date.ts)         | time slots, rounding to 30 min, local time → UTC instant, FR formats, durations      |
| [`inertia/utils/calendar.ts`](inertia/utils/calendar.ts) | merging tasks + events, chronological sort, vue-cal entries, time range, permissions |
| [`inertia/utils/chat.ts`](inertia/utils/chat.ts)         | group message rendering                                                              |
| [`inertia/utils/groups.ts`](inertia/utils/groups.ts)     | group labels                                                                         |

```bash
npm run test:unit        # once
npm run test:unit:watch  # watch mode
```

> The script pins `TZ=Europe/Paris` to make timezone tests deterministic
> (e.g. 12:30 in Paris in summer = `10:30Z`). Files: `inertia/**/*.test.ts`.

## 2. Integration tests (Japa)

One suite per domain in `tests/functional/`: authentication, profile, password
reset, todolists, tasks (creation, due date, reordering), groups (invitations,
chat) and calendar.

Two suites cover the calendar:

- [`tests/functional/event_calendar.spec.ts`](tests/functional/event_calendar.spec.ts) —
  events created from the calendar: personal or shared with a group, edit
  permissions (creator or group owner), rejection of an inverted time slot,
  contents of the iCal feed.
- [`tests/functional/task_due_date.spec.ts`](tests/functional/task_due_date.spec.ts) —
  `PUT /api/tasks/:id`: setting / clearing the due date, preserving the exact
  instant (`timestamptz` column), validation, per-user isolation, status.

```bash
npm run test              # every Japa suite
npm run test:integration  # functional suite only
```

> ⚠️ **These tests wipe the database they run against.** On the host, `.env.test`
> (`DB_DATABASE=pomodb_test`) isolates them in a dedicated database. **Inside the
> container it does not**: the variables Compose injects from `.env.docker` take
> precedence over `.env.test`, so `docker compose exec app npm run test:integration`
> runs against `pomodb` — the dev database. Restore the demo data afterwards with
> `docker compose exec app npm run migrate`.
>
> First-time setup on a new machine (running on the host):
>
> ```bash
> # create the database once (psql / adminer): CREATE DATABASE pomodb_test;
> NODE_ENV=test node ace migration:run
> ```
>
> `SESSION_DRIVER=memory` (already set in the npm scripts and in `.env.test`) is
> required: with the cookie driver, `loginAs()` does not log the client in.

## 3. End-to-end tests (Cypress)

Real browser journeys, in `cypress/e2e/`: task due date
([`due_date.cy.ts`](cypress/e2e/due_date.cy.ts)), status cycling
([`status_badge.cy.ts`](cypress/e2e/status_badge.cy.ts)), reordering
([`task_reorder.cy.ts`](cypress/e2e/task_reorder.cy.ts)), groups and chat
([`group.cy.ts`](cypress/e2e/group.cy.ts), [`group_chat.cy.ts`](cypress/e2e/group_chat.cy.ts)),
profile ([`profile.cy.ts`](cypress/e2e/profile.cy.ts)).

Two constraints to keep in mind:

1. **E2E needs a _served_ app** (real browser) plus a seeded database.
2. **Cypress does not run on Alpine/musl** (the binary is compiled for glibc/Debian,
   and it needs Xvfb plus system libraries). Typical error:
   `missing the dependency: Xvfb`, or a `bad option: --no-sandbox` during
   `cypress verify` when those libraries are missing.
   → Never run `cypress run` inside the Alpine app container; if the host lacks the
   system dependencies, go with option B or C.

### Option A — locally, on the host (the simplest)

The app is running (dev or Docker), Cypress runs on the **host** (not on Alpine):

```bash
npx cypress install      # binary (skipped at install time via CYPRESS_INSTALL_BINARY=0)
npm run dev              # app on http://localhost:3333, seeded database
# in another terminal:
npm run cypress:open     # interactive   (or: npm run test:e2e for headless)
```

### Option B — everything in containers (all three suites in one command)

`docker-compose.test.yml` is an **override** of `docker-compose.yml`: it reuses
`postgres` + `app` and adds a single `tests` service (Debian-based
**`cypress/included`** image, which does not break like Alpine). That container
chains **unit → e2e → integration** (the Japa tests reset the database, so they run
last). It shares the app's network stack so that `127.0.0.1:3333` is reachable.

From the **repository root**:

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build -V \
  --abort-on-container-exit --exit-code-from tests
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

Expected result: the `tests` service exits with code 0 and all three suites are green.

### Option C — CI (GitHub Actions)

The `e2e` job in [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) runs on
`ubuntu-latest` (Debian, so no Alpine trouble) through `cypress-io/github-action`,
which installs Cypress, migrates + seeds, starts the server, waits for it and then runs
the specs. The `quality` job, which `e2e` depends on, runs lint, typecheck, migrations,
the Japa suites and then Vitest against a disposable Postgres.
