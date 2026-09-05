# Changelog

All notable changes to this project are documented in this file.

## [0.4.0] — 2026-09-05

### Added
- Billing intervals (1 / 3 / 6 / 12 months) with automatic discounts on longer periods.
- Session-aware organization resolution: signed-in users always operate in their own
  organization instead of demo data.
- Plan prices and savings shown on the Billing page.
- Unit test suite (Vitest) for pricing model and invoicing logic.

### Changed
- Plan changes restricted to upgrades only (client UI + `/api/subscription` backend
  rejects downgrades and cancellations).
- Pricing extracted into `src/lib/plans.ts` as a single source of truth.

## [0.3.0] — 2026-09-04

### Added
- Google OAuth sign-in with auto-provisioning of profile → organization → free subscription.
- `/api/auth/org-provision` flow (`/auth/signin-redirect`) for reliable org cookie setup.
- Document editor left sidebar.

### Fixed
- Real (non-demo) API keys shown to signed-in users.

## [0.2.0]

- Vercel deployment with GitHub Actions auto-deploy.
- Public REST API with `ic_`-prefixed API keys.
- Webhooks, email sequences, recurring documents, audit log, analytics, team invites.

## [0.1.0]

- Initial release: proposals / invoices / acts editor, PDF export, client portal,
  templates, multi-language UI (EN/RU), dark mode.