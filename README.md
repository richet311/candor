# Candor

A donation platform where a nonprofit's fundraising page isn't a progress bar
with a vague percentage: it's an open ledger. Every dollar raised and every
dollar spent is itemized, categorized, and visible to a donor before they give.

## Why

Most donation platforms show a thermometer graphic and a "trust us" caption.
Candor treats the fund like a small accounting system. An admin logs each
expense against a category as it happens, a donor's payment is reconciled
through a signed Stripe webhook rather than trusted on the client's word, and
every state-changing action (a login, a fund created, an expense logged, a
donation confirmed) is written to an audit trail instead of disappearing
into application logs.

## Architecture

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ React (Vite) │          │ Express API  │          │   Postgres   │
│    client    │─REST──►  │ (TypeScript) │──────►   │   database   │
└──────────────┘          └──────────────┘          └──────────────┘
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        ▼                                                    ▼
┌────────────────────────────┐          ┌────────────────────────────┐
│     2 OAuth providers      │          │      Stripe Checkout       │
│       Google, GitHub       │          │      + signed webhook      │
│                            │          │   confirms the donation    │
└────────────────────────────┘          └────────────────────────────┘
```

Postgres holds users, funds, expenses, donations, refresh tokens, OAuth
account links, and the audit log.

Trust boundaries are verified server-side rather than assumed from client
input: a password login checked against a bcrypt hash with lockout after
repeated failures, an OAuth identity confirmed either by verifying a signed
ID token (Google) or by the server itself exchanging an authorization code
directly with the provider (GitHub), and a Stripe webhook whose signature
is checked before any donation is marked paid. See
`server/src/services/authService.ts`, `oauthProviders.ts`, and
`stripeService.ts`.

## What's built

- **API** (`server/`): Express + TypeScript + Prisma + Postgres.
  - **Auth**: email/password (bcrypt, cost 12) plus two independent,
    individually optional OAuth providers (Google, GitHub), all issuing a
    short-lived JWT access token plus an httpOnly, rotating refresh token.
    Each refresh rotation invalidates the previous token; presenting an
    already-rotated token is treated as token theft and revokes every
    session for that user (`authService.refreshSession`). Google uses its
    ID-token flow (`googleAuthService.ts`); GitHub uses an
    authorization-code redirect flow (`oauthProviders.ts`) with a signed,
    self-verifying `state` token for CSRF protection instead of a cookie.
    `GET /api/auth/oauth/providers` reports which are actually configured;
    the login and register pages only render buttons for those
    (`OAuthButtons.tsx`). Both converge on the same account-linking logic
    (`findOrCreateOAuthUser`): matched by provider account first, then by
    email, so signing in with a second provider on the same email links to
    the existing account instead of creating a duplicate.
  - **Authorization**: role-based (`ADMIN` / `DONOR`) middleware plus
    resource-level checks. An org admin can only log expenses against
    their own organization's funds, enforced server-side, not just hidden
    in the UI (`fund.routes.ts`, `expense.routes.ts`).
  - **Payments**: Stripe Checkout session creation and a webhook handler
    that verifies the signature before updating donation state
    (`stripeService.ts`, `webhook.routes.ts`).
  - **Audit trail**: every auth event, fund/expense/donation mutation, and
    security event (failed logins, rate-limit hits, authorization denials,
    invalid webhook signatures) is written to an `AuditLog` table, visible
    to org admins at `/api/audit-log`.
  - **Hardening**: Helmet security headers plus a strict CSP, a CORS
    allowlist, per-route rate limiting (tighter on auth and donation
    endpoints), Zod validation on every input, and a centralized error
    handler that never leaks internals in production.
  - 20 passing tests (Vitest + Supertest against a real Postgres instance)
    covering account lockout, cross-organization authorization, Stripe
    webhook signature verification (valid and forged), the OAuth state
    token (valid, wrong provider, tampered), the account-linking logic,
    and the rate limiter itself.
- **Client** (`client/`): React + TypeScript + Vite + Tailwind, React
  Router, Recharts. A small reusable UI kit (`components/ui/`), Button,
  Card, Input, Modal, Badge, Toast, ProgressBar, instead of one-off styles
  per page. A public fund page shows the raise-vs-spend numbers, a
  spending-by-category chart, and a chronological activity feed with no
  login required. Every API error surfaces two ways at once: a toast the
  user actually sees, and a scoped console log (`[candor:<module>]`)
  for whoever's debugging it. See `lib/logger.ts` and
  `context/ToastContext.tsx`.
- **Demo data**: 33 real, verified nonprofits (see "Demo data" below) show a
  green "Verified nonprofit" badge that links back to their IRS registry
  entry. Donation activity on those funds is clearly labeled as simulated.

## Security

- **Layered authentication**: password (with lockout) and two OAuth
  providers are independent paths into the same account model, matched by
  email. Stripe is a separate trust boundary again. It never authenticates
  a user, but every donation it confirms is verified via signed webhook,
  not a client-side redirect.
- **OAuth done server-side, not trust-the-client**: Google's ID token is
  verified against Google's public keys before anything is read from it.
  GitHub never sends a token through the browser at all. The
  authorization code is exchanged for a profile directly between this
  server and the provider over an authenticated HTTPS request, which is a
  stronger guarantee than trusting whatever the client claims.
- **JWT access + rotating refresh tokens**: the access token lives in
  memory on the client, never localStorage, and expires in 15 minutes; the
  refresh token is an httpOnly, `sameSite=lax` cookie scoped to
  `/api/auth`, rotated on every use, with theft detection that revokes the
  whole session chain.
- **Account lockout**: 5 failed password attempts locks the account for 15
  minutes; every attempt, success or failure, is audit-logged.
- **Rate limiting**: `express-rate-limit`, tighter on `/api/auth` (10 per
  15 min) and `/api/donations/checkout` (20 per hour) than general API
  traffic (300 per 15 min). Every 429 is both logged and audit-recorded.
- **Webhook signature verification**: `stripe.webhooks.constructEvent`
  rejects anything not signed with the real webhook secret before it can
  touch a donation record. A forged signature is treated as a security
  event, not just a 400.
- **Defense in depth on every write**: Zod schema validation, Prisma
  parameterized queries (no raw SQL string building), and RBAC checked
  server-side on every mutating route regardless of what the UI shows.
- **Secrets never in the repo**: `.env.example` files document what's
  required; real secrets stay in untracked `.env` files.

## Tech stack

TypeScript, Express, Prisma / Postgres, Zod, bcryptjs, jsonwebtoken,
google-auth-library, Stripe, Helmet, express-rate-limit, Vitest /
Supertest, React 19, Vite, React Router, Tailwind CSS v4, Recharts,
Docker Compose

## Running locally

### 1. Database

```bash
docker compose up -d db
```

### 2. API

```bash
cd server
npm install
cp .env.example .env   # fill in JWT secrets (openssl rand -base64 48) and
                        # Stripe test keys; OAuth providers are optional, see below
npm run prisma:migrate
npm run dev             # http://localhost:4000
```

### 3. Client

```bash
cd client
npm install
cp .env.example .env    # VITE_API_URL, and the same Google client ID as above
npm run dev              # http://localhost:5173
```

## Testing

```bash
cd server
npm test
```

Runs against a real Postgres database, not a mock, including a genuine
Stripe webhook signature check via `stripe.webhooks.generateTestHeaderString`,
so the test proves the verification logic actually works rather than
asserting a mocked function was called. Tests truncate tables between runs
(`__tests__/helpers.ts`), so they run against a separate `candor_test`
database on the same Postgres instance rather than the one the dev server
reads from; `env.ts` swaps to it automatically whenever `NODE_ENV=test`.
`docker compose up -d db` creates it automatically on a fresh volume via
`docker/init-test-db.sql`; if you already had the `db` container running
before pulling this, create it once with:

```bash
docker exec candor-db-1 psql -U candor -d candor -c "CREATE DATABASE candor_test OWNER candor;"
cd server && DATABASE_URL="postgresql://candor:candor_dev_only@localhost:5433/candor_test" npm run prisma:deploy
```

## Stripe webhooks locally

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Copy the printed signing secret into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

## Demo data: real nonprofits, simulated activity

```bash
cd server
npm run seed:nonprofits      # one-time, idempotent
npm run simulate:donations   # requires the API server already running
```

`seed:nonprofits` pulls real name, EIN, city, and state for 33 well-known
nonprofits from the IRS registry via [ProPublica's Nonprofit Explorer
API](https://projects.propublica.org/nonprofits/api) and creates a verified
`Organization` and starter `Fund` for each, so `/funds` shows real
organizations instead of placeholder test data. It's idempotent and safe to
rerun.

`simulate:donations` builds a real `checkout.session.completed` event, signs
it with the actual webhook secret, and POSTs it to the running server's own
`/api/webhooks/stripe` route on a random interval, the same path a real
Stripe donation takes. No money moves and no real donor is involved; every
verified organization's page says so directly. Pass `--once` for a single
donation instead of a continuous loop.

## Sign-in providers

Every provider below is optional and independent. `GET
/api/auth/oauth/providers` reports which ones have credentials configured,
and the login/register pages only render a button for those, so the app
runs fine on email/password alone with nothing else set up. Google is a
client-side ID-token flow; GitHub is a server-side redirect flow with no
client-side secret at all.

### Google

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
**OAuth consent screen** (External, fill in app name and your email) →
**Credentials** → **Create Credentials** → **OAuth client ID** → **Web
application**. Add `http://localhost:5173` as an authorized JavaScript
origin (no redirect URI needed, this flow doesn't use one). Set the same
client ID as `GOOGLE_CLIENT_ID` in `server/.env` and
`VITE_GOOGLE_CLIENT_ID` in `client/.env`.

### GitHub

[GitHub Developer Settings](https://github.com/settings/developers) → **New
OAuth App**. Homepage URL `http://localhost:5173`, Authorization callback
URL `http://localhost:4000/api/auth/oauth/github/callback`. Set
`GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `server/.env`. Nothing goes
in the client env.

## Deploying

Client, API, and database are deployed separately: Cloudflare Pages, Render,
and Neon. `render.yaml` in the repo root is a Render Blueprint that defines
the API service; Cloudflare Pages is configured through its dashboard, no
extra file needed.

### 1. Database (Neon)

Create a free project at [neon.tech](https://neon.tech). Copy the pooled
connection string, it becomes `DATABASE_URL`. Render also offers a free
Postgres instance, but it expires 30 days after creation and gets deleted;
Neon's free tier doesn't expire, so it's the better fit for something meant
to stay up.

### 2. API (Render)

Push this repo to GitHub, then in Render: **New** → **Blueprint**, point it
at the repo. It reads `render.yaml` and creates the `candor-api` web
service. Fill in the env vars marked `sync: false` in the Render dashboard:
`DATABASE_URL` (from Neon), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
and the OAuth ones if you're using them. `JWT_ACCESS_SECRET` and
`JWT_REFRESH_SECRET` are generated for you. Migrations run automatically on
every deploy (`prisma migrate deploy` is in the start command). Free-tier
services sleep after ~15 minutes idle; the first request after that takes
30-50s to cold start.

### 3. Client (Cloudflare Workers static assets)

Cloudflare's dashboard now deploys static sites as a Worker with static
assets rather than a classic "Pages project," so it builds from
`client/wrangler.jsonc` instead of a "build output directory" field.
Dashboard → **Workers & Pages** → **Create** → connect this repo → set
**Path** to `client` and **Build command** to `npm run build`; leave
**Deploy command** as the pre-filled `npx wrangler deploy`, it reads
`wrangler.jsonc` automatically. Add env var `VITE_API_URL` set to your
Render service's URL plus `/api`. `not_found_handling` in `wrangler.jsonc`
is set to `single-page-application`, so client-side routes don't 404 on a
hard refresh (the classic-Pages `_redirects` file in `client/public/` is
harmless but unused by this deploy path).

### 4. Wire them together

Once you have the Pages URL, set `CLIENT_ORIGIN` on Render to that exact
origin and redeploy the API, CORS and the OAuth redirect both check it. If
you're using Google or GitHub sign-in, add the new domains to those
providers' dashboards too. For the Stripe webhook, add an endpoint in the
Stripe dashboard (test mode) pointing at
`https://<your-api>.onrender.com/api/webhooks/stripe`, then copy its
signing secret into `STRIPE_WEBHOOK_SECRET` on Render.
