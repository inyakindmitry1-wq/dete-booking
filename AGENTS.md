# Agent Instructions & Project Guidelines

This repository implements a multi-tenant, white-label Progressive Web App (PWA) online booking system for auto service centers and detailing studios.

## Core Rules & Invariants
1. **Multi-Tenancy**: Single unified JS/CSS build, single Supabase project, `tenant_id` on all tenant-scoped data. Routes: `/s/:slug/` for clients, `/s/:slug/owner/` for shop owners.
2. **Config-Driven White-Labeling**: `business.json` and images define a tenant. Database is runtime source of truth. Publishing a new tenant or re-publishing never drops existing bookings or owner media.
3. **Continuous Resource Occupancy**: Services occupy specific eligible resources (bays, lifts) for continuous ranges (including multi-day and buffer time). Overlap prevention is enforced at the database level via PostgreSQL `EXCLUDE` constraint on `resource_occupancies`.
4. **Atomic Booking Transactions**: Creation, rescheduling, and cancellation are atomic database operations. Clients never set price, duration, or tenant ID. Requests are idempotent. Reschedule failure must never forfeit original booking.
5. **No Customer Registration**: Customers access bookings via cryptographic access token (DB only holds SHA-256 hash). Owner accounts are authenticated via Supabase Auth with server-verified `tenant_members` mapping. No public owner signup.
6. **Strict RLS & Data Protection**: Anonymous users cannot read customer PII, raw tokens, or payments. Service role keys and LLM keys are strictly server-side (Edge Functions). Private owner cache cleared on logout and excluded from Service Worker.
7. **Scoped AI Assistant**: LLM communicates via configurable `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL`. Pre-authorized server-side tools execute with fixed `tenant_id`. Client and owner tools have strict privilege separation.
8. **SQL-Driven Accurate Analytics**: Distinguish between arrivals (`checked_in`), completed orders, and actual payments (`payments`). Future booking amounts are never reported as revenue.
9. **Per-Tenant PWA & Manifest**: Dynamic Web App Manifest (`id`, `start_url`, `scope`), icons, splash, and metadata. Dedicated service worker cache namespaces.
10. **Reliable Outbox Notifications**: Web Push via VAPID, Supabase Cron, and outbox table `notification_jobs` with worker leases, retries, and deduplication.
11. **Preview vs Live**: Preview tenants contain demo data and do not trigger real external notifications.
12. **Rate & Budget Limits**: Atomic database counters protect endpoints and LLM costs. Booking functions independently of AI availability.

<!-- ASTRYX:START -->
Astryx v0.6.7 · 168 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:
1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx template <Block>` for parts it lacks; `astryx component <Name>` to read props before using one.
Changing an existing page? Keep it: skip step 2 and add blocks/components inside its sections.

RULES:
- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then Tailwind utilities backed by tokens. No raw hex/px.
- Palettes and custom colors go through the theme, never :root overrides. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any style={{…}}, raw <div>/<span>, imported .css/@apply, or hardcoded/arbitrary value (bg-[#fff], p-[13px]) with the component or a token-backed utility.

`astryx help` lists every command. Key ones beyond the workflow:
  search "<query>"   find any component / hook / doc / template
  discover <words>   integrations you could add
  docs <topic>       getting-started, principles, tokens, theme … (`astryx docs` lists all)
  docs cli           commands, API reference, integration authoring
  upgrade --from <old version> --apply   run after a dependency bump
<!-- ASTRYX:END -->
