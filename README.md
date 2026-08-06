# ClearFund

A donation platform where a nonprofit's fundraising page isn't a progress bar
with a vague percentage: it's an open ledger. Every dollar raised and every
dollar spent is itemized, categorized, and visible to a donor before they give.

## Why

Most donation platforms show a thermometer graphic and a "trust us" caption.
ClearFund treats the fund like a small accounting system. An admin logs each
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
│        Google OAuth        │          │      Stripe Checkout       │
│     ID token verified      │          │      + signed webhook      │
│        server-side         │          │   confirms the donation    │
└────────────────────────────┘          └────────────────────────────┘
```

Postgres holds users, funds, expenses, donations, refresh tokens, and the
audit log.

Three independent trust boundaries, each verified server-side rather than
assumed from client input: a password login checked against a bcrypt hash
with lockout after repeated failures, a Google credential verified against
Google's public keys (`google-auth-library`), and a Stripe webhook whose
signature is checked before any donation is marked paid. See
`server/src/services/authService.ts`, `googleAuthService.ts`, and
`stripeService.ts`.

## What's built

- **API** (`server/`): Express + TypeScript + Prisma + Postgres.
  - **Auth**: email/password (bcrypt, cost 12) and Google OAuth, issuing a
    short-lived JWT access token plus an httpOnly, rotating refresh token.
    Each refresh rotation invalidates the previous token; presenting an
    already-rotated token is treated as token theft and revokes every
    session for that user (`authService.refreshSession`).
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
  - 10 passing tests (Vitest + Supertest against a real Postgres instance)
    covering account lockout, cross-organization authorization, Stripe
    webhook signature verification (valid and forged), and the rate
    limiter itself.
- **Client** (`client/`): React + TypeScript + Vite + Tailwind, React
  Router, Recharts. A small reusable UI kit (`components/ui/`), Button,
  Card, Input, Modal, Badge, Toast, ProgressBar, instead of one-off styles
  per page. A public fund page shows the raise-vs-spend numbers, a
  spending-by-category chart, and a chronological activity feed with no
  login required. Every API error surfaces two ways at once: a toast the
  user actually sees, and a scoped console log (`[clearfund:<module>]`)
  for whoever's debugging it. See `lib/logger.ts` and
  `context/ToastContext.tsx`.

## Security

- **Layered authentication**: password (with lockout) and Google OAuth are
  independent paths into the same account model; account matching is by
  email. Stripe is a third, separate trust boundary. It never authenticates
  a user, but every donation it confirms is verified via signed webhook,
  not a client-side redirect.
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
cp .env.example .env   # fill in JWT secrets (openssl rand -base64 48),
                        # a Google OAuth client ID, and Stripe test keys
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

Runs against a real Postgres database (the one from `docker compose up -d
db`), not a mock, including a genuine Stripe webhook signature check via
`stripe.webhooks.generateTestHeaderString`, so the test proves the
verification logic actually works rather than asserting a mocked function
was called.

## Stripe webhooks locally

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Copy the printed signing secret into `server/.env` as `STRIPE_WEBHOOK_SECRET`.

## Google sign-in setup

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) →
Create Credentials → OAuth client ID → Web application. Add
`http://localhost:5173` as an authorized JavaScript origin. Set the same
client ID as `GOOGLE_CLIENT_ID` in `server/.env` and `VITE_GOOGLE_CLIENT_ID`
in `client/.env`. The server independently verifies the token against
Google's public keys rather than trusting anything the client asserts about
who signed in.
