# InvoiceCraft ✨

AI-powered generator of professional proposals, invoices and acts for small businesses.

Generate ready-to-send commercial documents in ~30 seconds: describe the service, get the whole document drafted by AI, tweak, export to PDF.

## Features

- **AI generation** — describe the service, get title, line items, pricing, notes and terms auto-generated (OpenAI GPT-4o)
- **3 document types** — proposals, invoices, acts of completed work
- **Document editor** — manual editing of line items, notes, terms, client/company info
- **PDF export** — beautiful A4 PDF via @react-pdf/renderer
- **Bilingual UI** — Russian and English (next-intl)
- **Landing page with pricing** — Free / Pro / Business
- **Subscription billing** — Stripe Checkout + webhooks + customer portal
- **Auth-ready** — Supabase schema (profiles, orgs, docs, templates, subscriptions) with RLS and triggers

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google) |
| AI | OpenAI GPT-4o |
| Payments | Stripe Checkout + Webhooks |
| PDF | @react-pdf/renderer |
| i18n | next-intl |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in real values:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_...`) |
| `NEXT_PUBLIC_APP_URL` | Your app URL, e.g. `http://localhost:3000` |

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the URL + keys into `.env.local`
3. Run the schema in the Supabase SQL editor: open `supabase/schema.sql` and paste/run it.
   This creates all tables, Row Level Security policies, and triggers (auto `profiles` on signup, free subscription, `updated_at`).

### 4. Set up Stripe

1. Create products/prices in the Stripe dashboard:
   - **Pro** — monthly, e.g. `$19`, set product metadata `plan: pro`
   - **Business** — monthly, e.g. `$49`, set product metadata `plan: business`
2. Copy the price IDs into `src/app/api/stripe/checkout/route.ts` (`STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`) or env.
3. Configure a webhook endpoint pointing to `{APP_URL}/api/stripe/webhook`, subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

> For local testing use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 5. Run

```bash
npm run dev          # development
npm run build        # production build
npm start            # run production build
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── [locale]/            # i18n pages
│   │   ├── page.tsx         # Landing
│   │   ├── dashboard/       # Overview + quick actions
│   │   ├── editor/          # AI document editor
│   │   ├── documents/       # List of documents
│   │   ├── templates/       # Template gallery
│   │   ├── settings/        # Company settings
│   │   ├── billing/         # Subscription management
│   │   └── auth/            # Login / Signup
│   └── api/
│       ├── ai/generate      # OpenAI document generation
│       ├── pdf              # PDF export
│       └── stripe/          # checkout, portal, webhook
├── components/
│   ├── app-sidebar.tsx      # App navigation sidebar
│   ├── auth-form.tsx        # Auth UI
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── supabase/            # Supabase clients
│   ├── i18n/                # next-intl config
│   ├── openai.ts
│   └── stripe.ts
├── messages/                # en.json, ru.json translations
└── types/
```

## Next Steps / Roadmap

- [ ] Wire real auth + profile creation (Supabase Auth is configured in schema)
- [ ] Persist documents to DB (schema ready)
- [ ] Save/duplicate templates
- [ ] Send email to client directly
- [ ] Team seats for Business plan
- [ ] Stripe customer portal wiring in billing UI

## Deployment

Deploy to Vercel in 2 minutes:

```bash
npx vercel
```

Set the same `.env.local` variables in the Vercel project settings (or use your production-provider env vars).
