# InvoiceCraft

Production-ready B2B SaaS for proposals, invoices and acceptance acts (AKT). Built as a multi-tenant
Next.js application with Supabase, with document generation, PDF export, a public client portal,
a REST API, webhooks, email sequences, recurring billing and subscription monetization.

## Features

- **Documents** — proposals, invoices and acceptance acts with a line-item editor, tax modes
  (none / VAT / NDS / GST), custom numbering (`INV-2026-001`), service presets and one-click AI
  draft generation (OpenAI).
- **PDF export** — pixel-perfect branded PDFs, single and bulk download.
- **Client portal** — public/shared document links with optional PIN signing, white-label options.
- **Templates** — reusable document templates per category plus built-in system templates.
- **Multi-tenancy** — every signed-in user owns an organization (`organizations.user_id`); all
  data (documents, keys, webhooks, sequences) is scoped by `org_id`.
- **Auth** — Supabase email/password + Google OAuth, auto-provisioning of profile, organization
  and a free subscription on signup (DB triggers).
- **Subscriptions** — `free / pro / business` plans with billing intervals (1 / 3 / 6 / 12 months),
  automatic discount on longer periods, upgrade-only enforcement (server- and client-side).
- **Public REST API** — `ic_`-prefixed API keys, `GET /api/v1/documents`, `GET /api/v1/stats` with
  bearer-token auth and last-used tracking.
- **Webhooks** — org-scoped webhook endpoints with test-firing.
- **Email sequences** — multi-step email sequences with scheduling.
- **Recurring documents** — auto-scheduling and regeneration.
- **Team** — multi-member teams with invites (accept flow).
- **Audit log** — org-scoped audit trail for key actions.
- **Analytics** — revenue/document dashboards.
- **i18n** — Russian and English (`next-intl`), dark/light theme.

## Tech Stack

| Layer      | Choice                                        |
| ---------- | --------------------------------------------- |
| Framework  | Next.js 16 (App Router, React 19, TypeScript) |
| Styling    | Tailwind CSS v4 + shadcn/ui on Base UI        |
| Backend    | Supabase (PostgreSQL, Auth, RLS, RPC)         |
| PDF        | `@react-pdf/renderer`                          |
| AI         | OpenAI (`gpt-*` chat completions)              |
| Payments   | Stripe (checkout, customer portal, webhooks)   |
| Email      | Resend (`/api/sequences/run`)                  |
| i18n       | next-intl                                      |
| Deploy     | Vercel + GitHub Actions (auto-deploy)          |
| Testing    | Vitest                                         |

## Repository Layout

```
middleware.ts          # next-intl locale routing + sign-in wall + org cookie provisioning
src/
  app/
    [locale]/            # localized pages (dashboard, documents, editor, billing, settings, ...)
      api-client.tsx etc # per-page client components
    api/
      auth/org-provision # org cookie provisioning after login
      api-keys/          # org-scoped API key CRUD (ic_ prefixed)
      v1/                # public REST API (documents, stats)
      documents/         # document CRUD + AI draft generation
      pdf/               # single + bulk PDF rendering
      portal/            # public share/sign endpoints
      webhooks/          # webhook endpoints + test firing
      sequences/         # email-sequence scheduling/sending
      recurring/         # recurring document generation
      subscription/      # plan upgrade endpoint (upgrade-only)
      stripe/            # checkout, customer portal, webhook
      team/, teams/      # invitations and members
  components/            # app shell (AppSidebar) + ui kit (Base UI primitives)
  lib/
    billing.ts           # pure invoicing logic (numbers, totals, taxes)
    plans.ts             # pure pricing model (plans, intervals, discounts)
    api-keys.ts          # key generation + bearer resolution
    server-org.ts        # active org resolution (cookie → session → DB lookup)
supabase/
  schema.sql             # core schema + RLS + signup triggers
  auth-schema.sql        # profile/org/subscription provisioning trigger
  api-webhooks-schema.sql, email-sequences-schema.sql,
  recurring-schema.sql, audit-log-schema.sql, ... # feature schemas
```

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- Stripe test keys, Resend API key and OpenAI key if you want those integrations

### 2. Install

```bash
npm install
cp .env.example .env.local
```

### 3. Configure environment variables

| Variable                          | Required | Description                              |
| --------------------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | yes      | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | yes      | Supabase anon (publishable) key          |
| `SUPABASE_SERVICE_ROLE_KEY`       | yes      | Service-role key (server only)           |
| `NEXT_PUBLIC_APP_URL`             | yes      | Public app URL (used for OAuth/callbacks)|
| `OPENAI_API_KEY`                  | optional | AI draft generation                      |
| `STRIPE_SECRET_KEY`               | optional | Stripe secret key                        |
| `STRIPE_WEBHOOK_SECRET`           | optional | Stripe webhook signing secret            |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | Stripe publishable key               |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_BUSINESS` | optional | Stripe Price IDs            |

> Do not commit `.env.local`. The example file documents every variable used by the app.

### 4. Set up the database

Run the SQL files in the Supabase SQL Editor (or via the Management API):

1. `supabase/schema.sql` — core tables, RLS policies, signup triggers
2. `supabase/*-schema.sql` — feature tables (webhooks, sequences, recurring, audit log, etc.)
3. `supabase/auth-schema.sql` — auto-provisions profile → org → free subscription on signup

Also enable the **Google provider** in Supabase Auth (Dashboard → Authentication → Providers) and add
the redirect URI `{NEXT_PUBLIC_APP_URL}/api/auth/callback`.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000, sign up, and you are ready.

## Testing

```bash
npm test            # Vitest unit tests (23 tests)
npm run lint        # ESLint (0 errors)
npm run build       # production build check
npm run test:e2e    # Playwright smoke tests (needs `npx playwright install`)
```

Unit tests cover the pricing model (`src/lib/plans.ts`), invoicing logic (`src/lib/billing.ts`),
and API key generation/resolution (`src/lib/api-keys.ts`). The CI workflow (`deploy.yml`) runs
lint + unit tests before every deployment.

## Deployment

### Vercel (recommended)

```bash
npx vercel
```

Configure all environment variables listed above in the Vercel project settings.

### Auto-deploy via GitHub Actions

A workflow at `.github/workflows/deploy.yml` deploys `main` to Vercel automatically.
It requires these repository secrets:

| Secret               | Description                        |
| -------------------- | ---------------------------------- |
| `VERCEL_TOKEN`       | Vercel access token                |
| `VERCEL_ORG_ID`      | Vercel team/project org identifier |
| `VERCEL_PROJECT_ID`  | Vercel project identifier          |

## Pricing Model

| Plan      | 1 mo    | 3 mo       | 6 mo        | 12 mo      |
| --------- | ------- | ---------- | ----------- | ---------- |
| Free      | $0      | $0         | $0          | $0         |
| Pro       | $29     | $79 (−9%)  | $149 (−14%) | $279 (−20%)|
| Business  | $99     | $259 (−13%)| $499 (−16%) | $949 (−20%)|

Pricing lives in `src/lib/plans.ts` (single source of truth); discounts are computed from the
monthly rates, and the backend rejects any non-upgrade plan change (`/api/subscription`).

## API Overview

API keys are `ic_`-prefixed random tokens issued per organization. Authenticate with:

```
Authorization: Bearer ic_<48-hex-chars>
```

| Endpoint              | Description                                   |
| --------------------- | --------------------------------------------- |
| `GET /api/v1/documents` | List documents for the key's organization   |
| `GET /api/v1/documents/:id` | Fetch one document                    |
| `GET /api/v1/stats`     | Org-level statistics                        |

Keys are created in the **API Access** page and stored hashed-reasonable (prefixed store) with
revocation and last-used tracking.

### Quickstart

```bash
# List documents
curl -H "Authorization: Bearer ic_YOUR_KEY" \
     https://invoicecraft-taupe.vercel.app/api/v1/documents

# Get stats
curl -H "Authorization: Bearer ic_YOUR_KEY" \
     https://invoicecraft-taupe.vercel.app/api/v1/stats
```

## Database Schema

Core tables (all scoped by `org_id`):

| Table                | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `profiles`           | User profile (auto-created on signup)        |
| `organizations`      | Tenant org (one per user, linked by user_id) |
| `subscriptions`      | Plan + billing interval + period end         |
| `documents`          | Proposals, invoices, acceptance acts          |
| `api_keys`           | `ic_`-prefixed bearer tokens                 |
| `webhooks`           | Webhook endpoints per org                    |
| `webhook_deliveries` | Delivery log for webhooks                    |
| `email_sequences`    | Multi-step email automation                  |
| `email_sequence_logs`| Execution log for sequences                  |
| `recurring_documents`| Scheduled recurring doc generation           |
| `audit_log`          | Org-scoped audit trail                       |
| `teams` / `team_members` / `team_invites` | Multi-member team support |

Signup triggers (`auth-schema.sql`) auto-provision: profile → organization → free subscription.
The middleware ensures every authenticated request has an `invoicecraft_org` cookie.

## License

MIT — see [LICENSE](LICENSE). Use it commercially, adapt it, resell it; attribution appreciated
but not required.