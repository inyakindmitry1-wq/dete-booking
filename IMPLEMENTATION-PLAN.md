# IMPLEMENTATION-PLAN: Multi-Tenant Auto Service & Detailing PWA

## Project Goal
A production-ready, white-label Progressive Web App (PWA) for online booking and business management tailored for auto detailing studios and car repair workshops. The system can be rebranded for any new business in minutes via a single `business.json` config and brand assets, without modifying core application code or breaking existing tenants.

---

## Architecture Invariants
1. **Unified Build & Single Database**: Single frontend SPA bundle deployed to Cloudflare Pages (or any static host), single Supabase Postgres backend. Every tenant entity is tagged with `tenant_id`. Routing: `/s/:slug/` for client portal, `/s/:slug/owner/` for shop management.
2. **Configuration Pipeline**: `business.json` + images are pipeline inputs; PostgreSQL is the runtime source of truth. CLI commands `npm run tenant:new`, `tenant:validate`, `tenant:publish`, and `tenant:verify` manage lifecycle.
3. **Continuous Resource Scheduling**: Services occupy dedicated resources (detailing bays, hydraulic lifts) over continuous time ranges (minutes, hours, or multi-day spans + buffers). Business working hours and holiday exceptions define booking intake intervals.
4. **PostgreSQL EXCLUDE Constraint**: Concurrency protection on `resource_occupancies` via `EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)`. Booking, rescheduling, and cancellation are atomic SQL stored procedures. Idempotency enforced via `idempotency_key`. Rescheduling preserves the original reservation on conflict.
5. **Zero-Friction Client Booking**: Customers book without registration. Access to a reservation is granted via a secure high-entropy random token (`access_token`), with only its SHA-256 hash stored in the DB. Shop owners authenticate via Supabase Auth, verified against `tenant_members`. No public owner registration.
6. **Row Level Security (RLS) & Permissions**: Anonymous users have zero read access to customer PII, payments, or raw tokens. Supabase Edge Functions execute administrative actions with service credentials and LLM keys. Private owner data is wiped upon logout and excluded from Service Worker caches.
7. **Scoped AI Assistant**: Edge function `ai-chat` connects to configurable `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. The server executes strictly scoped tools (client vs owner) with forced `tenant_id`. Includes multi-step tool loop and JSON-intent fallback.
8. **SQL Truth for Financials & Analytics**: Pure SQL calculations distinctively track arrivals (`checked_in`), completed orders, and collected cash/card payments. Projected values are never counted as realized revenue.
9. **Dynamic PWA Manifest & App Shell**: Each studio receives dynamic HTML title, icons, apple-touch-icon, and a custom `manifest.webmanifest` (`id`, `start_url`, `scope`).
10. **Transactional Outbox for Notifications**: Web Push (VAPID) and calendar alerts dispatched via `notification_jobs` table with distributed locking leases (`locked_until`), retries, and deduplication. Honest UI indicators for Safari/iOS PWA requirements.
11. **Preview vs Live Modes**: Preview tenants contain demo data and suppress live push alerts. Publishing retains historical customer orders and owner uploaded media.
12. **Rate Limiting & Degradation**: Atomic counters in `rate_limits` cap public requests and AI spend. Core booking remains operational even if AI services are down.

---

## 8 Execution Stages

### Stage 1: Project Foundation & Tooling Setup
- Setup Vite + React 19 + TypeScript Strict + Tailwind CSS + PostCSS.
- Setup shadcn/ui & Astryx components and theme provider with unified tokens and CSS layers.
- Setup React Router with `/s/:slug/` (client) and `/s/:slug/owner/` (owner) structures.
- Setup `vite-plugin-pwa` with `injectManifest` and custom `src/sw.ts` service worker.
- Set up project scripts in `package.json`.
- **Verification**: `npm run typecheck && npm run build` compiles without errors.

### Stage 2: Database Schema, Migrations, Constraints & Seed
- PostgreSQL tables: `tenants`, `resources`, `services`, `service_resources`, `working_hours`, `schedule_exceptions`, `resource_occupancies`, `customers`, `bookings`, `payments`, `tenant_members`, `notification_jobs`, `rate_limits`.
- Constraints: `btree_gist` extension, `EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)` on `resource_occupancies`.
- Atomic SQL functions: `create_booking_atomic`, `reschedule_booking_atomic`, `cancel_booking_atomic`, `get_available_slots`, `get_owner_stats`.
- Row-Level Security (RLS) policies and `SECURITY DEFINER` RPC interfaces.
- Seed data for two distinct tenants:
  1. `GRAPHITE Detailing` (`graphite`) — Luxury auto detailing studio.
  2. `APEX Pitstop` (`apex`) — Fast mechanical auto service & quick lube.
- **Verification**: Local SQL runner / test script verifies table creation, triggers, constraints, and seeds.

### Stage 3: Tenant Configuration Pipeline & CLI Tooling
- Define Zod schema in `src/shared/tenant-schema.ts` validating business identity, theme, services, resources, working hours, and exceptions.
- Provide initial tenant manifests: `tenants/graphite/business.json` and `tenants/apex/business.json` + visual assets.
- CLI scripts:
  - `tenant:new`: Scaffolds a new tenant config and asset folders.
  - `tenant:validate`: Validates `business.json` against Zod schema and confirms required asset files.
  - `tenant:publish`: Upserts tenant configuration into database without wiping historical bookings or user media.
  - `tenant:verify`: Verifies database state against config file.
- **Verification**: `npm run tenant:validate` and `npm run tenant:verify` pass for both tenants.

### Stage 4: Core Client Booking PWA
- Dynamic tenant theme loading (CSS variables, page title, favicon, apple-touch-icon, manifest).
- Studio presentation: hero header, services categorized with durations, pricing, photo galleries.
- Multi-step booking Bottom Sheet (shadcn Drawer):
  1. Service selection & vehicle classification (Sedan, SUV, Minivan).
  2. Date & slot selector calculating real-time availability with buffer times.
  3. Customer details: Name, phone, vehicle plate, notes.
  4. Confirmation & atomic booking execution.
- Client Booking Receipt Screen:
  - Cryptographic access token generation and management.
  - Direct deep link `/s/:slug/booking/:bookingId?token=...`.
  - Add to Apple/Google Calendar (.ics export).
  - Web Push permission request.
  - Self-service reschedule & cancellation.
- Offline support via Service Worker caching.
- **Verification**: Unit tests on slot calculation & client state; build check.

### Stage 5: Owner Mobile Dashboard
- Mobile-optimized owner portal `/s/:slug/owner/`.
- Supabase Auth login + tenant membership verification.
- Bays & Lifts Schedule View: timeline view of occupied bays, current status, customer notes.
- Quick Manual Bay Lock: block bay for maintenance or offline walk-in bookings.
- Booking Management Drawer: status transitions (`confirmed` -> `checked_in` -> `completed` / `cancelled`), record payments (`cash`, `card`, `transfer`).
- SQL-driven Analytics: arrivals, completed jobs, collected payments, bay utilization rate.
- Cache isolation: clears private data upon logout.
- **Verification**: Component and view tests for owner workflows.

### Stage 6: Supabase Edge Functions & Outbox Worker
- `booking-create`: Input validation, atomic SQL call, returns booking id and raw access token.
- `booking-lookup`: Validates token hash, returns booking details.
- `booking-reschedule`: Verifies token, atomic rescheduling.
- `booking-cancel`: Verifies token, atomic cancellation.
- `ics-export`: Generates standard RFC 5545 iCalendar payload.
- `notifications-worker`: Processes `notification_jobs` with worker leases (`locked_until`), Web Push dispatch via VAPID, deduplication.
- **Verification**: Node test runner executing edge function logic against mock/local database.

### Stage 7: AI Assistant Integration
- Edge Function `ai-chat` with configurable `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`.
- Pre-authorized server-side tools:
  - Public Client Tools: `check_available_slots`, `get_service_list`, `lookup_booking_status`.
  - Owner Tools: `get_daily_schedule`, `get_occupancy_stats`, `find_customer_history`.
- Strict authorization boundary: anonymous users cannot execute owner tools.
- Multi-turn tool execution loop with JSON intent fallback.
- Rate limits and tenant budget caps in DB `rate_limits`.
- **Verification**: AI tool routing and authorization test suite.

### Stage 8: Comprehensive Tests, E2E Flow & Documentation
- SQL & Integration Tests:
  - Concurrent booking race condition & EXCLUDE constraint test.
  - Multi-day occupancy spanning across days.
  - Manual bay lock conflict test.
  - Idempotency test (duplicate submission yields same booking & token).
  - Reschedule failure leaves original booking intact.
  - Tenant isolation & RLS test (Graphite cannot access Apex data).
  - Historical price snapshot test.
  - Payment vs revenue calculation test.
  - Outbox worker lease & deduplication test.
- Playwright E2E Flow:
  - Client books a service -> receives confirmation & access token -> booking appears in Owner Portal.
- Deliverables:
  - `.env.example`
  - `SETUP.md`
  - `CLONE-IN-6-MINUTES.md`
  - `ACCEPTANCE.md` with full audit report.
