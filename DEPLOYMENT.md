# Production deployment

## The mental model

```
   git push main
        │
        ▼
   ┌─────────────────── GitHub Actions ───────────────────┐
   │  quality      lint + types + tests (throwaway PG)    │
   │      ↓                                               │
   │  build-image  docker build --target production       │
   │                 → push to GHCR, tag = commit SHA     │
   │      ↓                                               │
   │  deploy       ssh VPS: pull + up -d + healthcheck    │
   └──────────────────────────────────────────────────────┘
        │
        ▼
   ┌──────────────── VPS ───────────────┐
   │  Internet ─► traefik ══ app ══ pg
   │              :80 :443
   └────────────────────────────────────┘
```

---

## Prerequisite: the domain name

**Let's Encrypt does not issue certificates for a bare IP address.** Without a
domain name there is no HTTPS — that is a hard blocker, not a configuration detail.

```bash
dig +short pomo.mydomain.com    # must return the VPS IP
```

Do not start the stack before this returns the right IP. Let's Encrypt allows
**5 certificates per domain per week**: if Traefik requests a certificate while
DNS does not point at the VPS yet, the failure eats into that quota.

---

## 1. Prepare the VPS

```bash
ssh root@<VPS_IP>
```

### Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### Create a non-root user for deployments

Never deploy as root: if the GitHub Actions SSH key leaks, it must not hand over
full control of the machine.

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy          # can drive Docker without sudo
mkdir -p /opt/pomo
chown deploy:deploy /opt/pomo
```

### Firewall

```bash
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
```

---

## 2. The deployment SSH key

A key **dedicated** to GitHub Actions, separate from your personal one: if it is
compromised you revoke it without losing your own access.

**On your machine:**

```bash
ssh-keygen -t ed25519 -C "github-actions-pomo" -f ~/.ssh/pomo_deploy -N ""
```

Two files are created:

- `~/.ssh/pomo_deploy.pub` → the **public** key, goes on the VPS
- `~/.ssh/pomo_deploy` → the **private** key, goes into the GitHub secrets

**Install the public key on the VPS:**

```bash
ssh-copy-id -i ~/.ssh/pomo_deploy.pub deploy@<VPS_IP>
```

**Check this before going any further:**

```bash
ssh -i ~/.ssh/pomo_deploy deploy@<VPS_IP> "docker ps"
```

---

## 3. The environment file on the VPS

```bash
ssh deploy@<VPS_IP>
cd /opt/pomo
nano .env          # paste the contents of .env.prod.example and fill it in
chmod 600 .env     # readable by nobody else
```

Generate both secrets **on the VPS**, not on your machine:

```bash
openssl rand -base64 32    # → APP_KEY
openssl rand -base64 24    # → DB_PASSWORD
```

`APP_KEY` signs the session cookies: changing it logs everyone out.

> `DB_PASSWORD` is only read by Postgres **when the volume is created**, on the
> very first start. Changing it later in `.env` does not change it in the
> database — you will have to do it in SQL, or destroy the volume (and the data
> with it).

> **This file lives on the VPS only. The pipeline never touches it** — the
> `deploy` job copies nothing but `docker-compose.prod.yml`. Your secrets
> therefore survive every `git push`. The trade-off: **every new variable added to
> the code (`start/env.ts`) has to be reported here by hand**, otherwise the `app`
> container refuses to boot (environment validation failure).

### OAuth variables (GitHub / Google sign-in)

`start/env.ts` requires `APP_URL` and the four OAuth secrets. Without them the
boot fails. `APP_URL` must be the public URL **in https** (the `DOMAIN`), because
it is what builds the callbacks:

```
APP_URL=https://pomo.willix.fr
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Create the credentials in each console, registering **exactly** these callbacks
(otherwise the provider rejects the request):

| Provider | Where                                               | Authorization callback URL               |
| -------- | --------------------------------------------------- | ---------------------------------------- |
| GitHub   | _Settings → Developer settings → OAuth Apps_        | `https://pomo.willix.fr/github/callback` |
| Google   | _Cloud Console → Credentials → OAuth 2.0 Client ID_ | `https://pomo.willix.fr/google/callback` |

The dev credentials (callback on `http://localhost:3333/...`) differ from the
production ones: either add both callbacks to the same app (Google and GitHub
accept several URLs), or create an app dedicated to production.

On the Google side, as long as the consent screen is in _Testing_ mode, only the
accounts registered as _test users_ can sign in; publish the app to open it to
everyone.

---

## 4. The GitHub secrets

`Settings > Secrets and variables > Actions > New repository secret`

| Secret        | Value                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `VPS_HOST`    | the public IP of the VPS                                                                                |
| `VPS_USER`    | `deploy`                                                                                                |
| `VPS_SSH_KEY` | the **entire** contents of `~/.ssh/pomo_deploy` (the private key, `-----BEGIN` and `-----END` included) |
| `GHCR_TOKEN`  | see below — not needed if you make the package public                                                   |

There is **no** secret for publishing the image: GitHub automatically provides a
`GITHUB_TOKEN` on every run, and the workflow's `permissions: packages: write`
clause gives it the right to write to GHCR.

`GHCR_TOKEN` is for the other end of the chain: the **VPS**, which has to _read_
the image. Two options:

- **Make the package public** — after the first push, go to the package page
  (`github.com/users/<you>/packages`) → _Package settings_ → _Change visibility_ →
  Public. You can then drop the `docker login` line from the workflow and this
  secret.
- **Keep it private** — create a _Personal Access Token (classic)_ with the single
  `read:packages` scope and put it in `GHCR_TOKEN`.

---

## 5. First deployment

The very first `docker compose up` cannot come from GitHub Actions: there is no
image in GHCR yet. So push to `main` first so the pipeline builds and publishes
the image, then, if the `deploy` job fails because
`/opt/pomo/docker-compose.prod.yml` does not exist yet, re-run it — the job copies
the compose file before deploying, so the second attempt succeeds.

Watch the certificate being issued:

```bash
ssh deploy@<VPS_IP>
cd /opt/pomo
docker compose -f docker-compose.prod.yml logs -f traefik
```

You should see Traefik solving the ACME challenge.

---

## 6. Umami (analytics)

Umami reuses the app's `postgres` container — no separate Postgres container, to
save VPS resources.

### DNS prerequisite

As with `DOMAIN`, a dedicated subdomain has to point at the VPS before the
service is started:

```bash
dig +short analytics.pomo.willix.fr    # must return the VPS IP
```

### Variables to add to `.env`

Before the deployment that introduces the `umami` service, complete
`/opt/pomo/.env` with (see `.env.prod.example`):

```bash
UMAMI_DOMAIN=analytics.pomo.willix.fr
UMAMI_DB_USER=umami_admin
UMAMI_DB_PASSWORD=      # openssl rand -hex 24
UMAMI_DB_DATABASE=umamidb
UMAMI_APP_SECRET=       # openssl rand -hex 32
UMAMI_WEBSITE_ID=
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USERNAME=resend
SMTP_PASSWORD=          # Resend API key, starts with "re_"
MAIL_FROM_ADDRESS=no-reply@willix.fr
MAIL_FROM_NAME=Pomo
```

### Create the dedicated role and database

This command runs **only once**, before the `umami` service starts for the first
time (otherwise its internal migrations fail for lack of a database):

```bash
cd /opt/pomo
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U pomo_admin -d pomodb \
  -c "CREATE ROLE umami_admin WITH LOGIN PASSWORD '<value of UMAMI_DB_PASSWORD>';" \
  -c "CREATE DATABASE umamidb OWNER umami_admin;"
```

Since `umami_admin` owns `umamidb`, it has by default every right it needs on
that database's `public` schema (no extra `GRANT` required).

### Deploy

Once `.env` is complete and the database created, a push to `main` triggers the
usual deployment (compose copy, `pull && up -d`), which starts `umami` alongside
`app`. Umami applies its own migrations on startup.

Check the certificate as you did for the main domain:

```bash
docker compose -f docker-compose.prod.yml logs -f traefik
```

### Get the Website ID

1. Open `https://analytics.pomo.willix.fr`.
2. Sign in with Umami's default credentials (`admin` / `umami`) and **change that
   password immediately** in the account settings.
3. Create a website: name `pomo`, domain `pomo.willix.fr`.
4. Umami generates a UUID (Website ID): copy it.
5. On the VPS, edit `/opt/pomo/.env` and set:

   ```bash
   UMAMI_WEBSITE_ID=<copied uuid>
   ```

6. Restart the `app` container only, so it picks up the variable (no rebuild, and
   no need to touch `umami`/`postgres`):

   ```bash
   docker compose -f docker-compose.prod.yml up -d app
   ```

As long as `UMAMI_WEBSITE_ID` is empty, no tracking script is injected into the
pages (see `config/umami.ts` and `resources/views/inertia_layout.edge`).

### Check that Umami works

```bash
docker compose -f docker-compose.prod.yml ps umami
docker compose -f docker-compose.prod.yml logs -f umami

curl -I https://analytics.pomo.willix.fr          # must return 200
curl -I https://analytics.pomo.willix.fr/script.js # must return 200
```

Visit `https://pomo.willix.fr`, browse a few pages, then open the Umami dashboard
(website "pomo") and check that the pageviews show up — including those from the
subsequent SPA navigations, not just the very first load.

### Upgrade Umami

The image is pinned to a stable version (`ghcr.io/umami-software/umami:3.2.0`),
not `latest` — so an upstream change never breaks production behind your back. To
upgrade: change the tag in `docker-compose.prod.yml`, then on the VPS:

```bash
docker compose -f docker-compose.prod.yml pull umami
docker compose -f docker-compose.prod.yml up -d umami
```

---

## 7. Database migrations

They are **not** run by hand: `docker-compose.prod.yml` defines a `migrate`
service that runs `node ace migration:run --force`, and `app` waits for it to
finish (`condition: service_completed_successfully`). A deployment therefore
applies the migrations automatically before starting the new version, and if a
migration fails the previous app stays up.

**Back up before any destructive migration.** `migration:run` runs without
confirmation: a migration that drops a column destroys its data, and rolling the
image back does not bring it back.

```bash
cd /opt/pomo
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U pomo_admin pomodb > backup-$(date +%F).sql
```

Spot the risky migrations before pushing to `main`: look for `dropColumn`,
`dropTable` or an `alterTable` turning a column `notNullable` in
`pomo/database/migrations/`. A concrete example, the
`remove_duration_from_tasks_table` migration (calendar feature) drops
`tasks.duration`: a task no longer has a duration, only a due date, and the
existing values are lost on deployment.

If something goes wrong, roll back the last batch of migrations:

```bash
docker compose -f docker-compose.prod.yml run --rm migrate \
  node ace migration:rollback --force
```

---

## Everyday operations

**Stack status**

```bash
docker compose -f docker-compose.prod.yml ps
```

**Logs**

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs traefik --tail 100
```

**Roll back to an earlier commit**

This is the point of tagging by SHA:

```bash
cd /opt/pomo
export APP_IMAGE=ghcr.io/williammcorreia/pomo:<PREVIOUS_SHA>
docker compose -f docker-compose.prod.yml up -d
```

Careful: this rolls back the **code**, not the **database schema**. A migration
that has already been applied is not undone — see section 7 for the rollback
command and the backup to take before a destructive migration.

**Database backup** (to do before any risky migration)

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U pomo_admin pomodb > backup-$(date +%F).sql
```

**Check that the database is unreachable from the Internet**

From your machine, this must fail (timeout or refusal):

```bash
psql -h <VPS_IP> -p 5432 -U pomo_admin
```

**Check that /health is not exposed**

```bash
curl -i https://pomo.mydomain.com/health     # must return 404
```
