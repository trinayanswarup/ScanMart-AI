# AGENTS-REPO.md

Project-specific guardrails for coding agents working in ScanMart AI.

## Overview

Two persistence layers:

- **Shared data** (stores, inventory, listings, orders, workflows, executions) → FastAPI backend (`scanmart-backend/`) → Supabase Postgres.
- **Customer cart** → `localStorage` only (`scanmart_cart_v1`), private per browser, never sent to the backend until checkout.

Don't conflate the two. Don't describe Supabase as "not yet connected" - it's live.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test      # 70 tests - run after logic changes
npm run build      # run for routing/config/dependency changes
```

## Repository map

```
app/
  page.tsx                Landing page
  auth/page.tsx            Admin login (hardcoded creds + demo bypass)
  admin/[storeId]/         Seller dashboard, scoped per store
  shop/[storeSlug]/        Public storefront
  cart/, order-confirmation/[id]/
  api/extract/route.ts     NVIDIA NIM endpoint
components/app-provider.tsx   State + API calls to backend
lib/                        ai.ts, seed.ts, validation.ts
types/index.ts               Shared domain types
__tests__/                   Vitest suite (70 tests)
supabase/                    schema.sql, schema_additions.sql
scanmart-backend/            FastAPI backend
eval/                        Python evaluation harness (standalone)
scanmart-preprocess/         Image preprocessing microservice (standalone, not wired in)
PRD.md
```

## Architecture rules

### State and API

- `AppProvider` is the single source of truth client-side.
- `useApp()` only under `AppProvider`.
- All shared data flows through the backend API (`NEXT_PUBLIC_API_URL`); cart mutations (`addToCart`, `removeFromCart`, `setCartQuantity`, `clearCart`) are pure `setState`, no API calls.
- Immutable updates; functional `setState` updaters when deriving from current state.
- Browser-only APIs stay in client components.

### Domain model

- `types/index.ts` is authoritative on the frontend; `scanmart-backend/models.py` mirrors it (camelCase) - keep both in sync.
- Update `supabase/schema.sql` / `schema_additions.sql` when a change belongs in the production model.
- Strict TypeScript - no `any`; narrow `unknown` explicitly.

### Backend

- Runs separately: `uvicorn main:app --reload` from `scanmart-backend/`.
- Connects via `DATABASE_URL` as the Postgres superuser, bypassing RLS - intentional, trusted service.
- Never add Supabase anon/service-role keys to the backend.
- `database.py` registers a jsonb codec - never `json.dumps()` before passing to a jsonb column.
- Don't touch `scanmart-backend/` on frontend-only tasks without clarifying scope first.

### Validation

- All untrusted data (AI output, forms, URL params, external APIs) validated with Zod before entering state.
- Extend `lib/validation.ts`, don't duplicate schemas.

### AI behavior

- Output is always reviewable and editable - never auto-committed.
- Preserve confidence, detected text, reasoning.
- Validate against `productAIExtractionSchema`.
- Conservative output over invented detail when evidence is weak.
- Mock provider stays deterministic - the app must work offline.
- Never silently swap the mock for a paid/network-dependent service.
- Preserve both original and corrected values when a user edits AI output.
- Free-tier only: NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`) via `app/api/extract/route.ts`.

### Scan modes

Four independent modes on `app/admin/[storeId]/scan/page.tsx`: Photo/Camera, Barcode, Text Entry, Receipt/Invoice. Receipt mode returns a line-item table and uses `addInventoryBulk`. Don't merge state/handlers across modes.

### Inventory and listings

- Quantities/thresholds never negative; prices positive when supplied.
- One listing per inventory item max.
- AI-confirmed scans create an unpublished draft + `PRODUCT_SCANNED` execution server-side, only when `source === "ai_scan"`.
- Publishing needs title, description, positive price.
- Storefront shows published listings only.

### Order acceptance - enforced by the backend

1. Verify stock for every line before mutating anything.
2. No partial reductions - abort entirely if any line fails.
3. Reduce stock exactly once.
4. Persist `stock_reduced_at` for idempotency.
5. Repeated acceptance never reduces stock again.
6. Order item name/quantity/price are immutable creation-time snapshots.

Backend uses `SELECT ... FOR UPDATE` to prevent races.

### Workflows

- Every consequential automated action stays visible in an execution trace.
- Nodes record input, output, status, error, timestamp.
- Human-approval nodes report success only after the user acts.
- Approval still enforces listing validation.
- Reuse existing execution status values.

### Eval and preprocessing tools

- `eval/` and `scanmart-preprocess/` are standalone Python tools - not imported by the Next.js app.
- Don't modify eval scripts as a side effect of frontend work.
- `scanmart-preprocess/` is not wired into the live scan page - don't assume it's active.

## UI conventions

- Match existing visual language; reuse global classes in `app/globals.css`.
- Lucide icons only, already-included ones.
- All colors via CSS custom properties - hard-coded hex breaks dark mode.
- Preserve the `800px` responsive breakpoint.
- Seller controls never appear on public/checkout routes.
- Every control needs a label or accessible name.
- Every state - empty, loading, success, error - must be explicit.
- Async buttons: disabled + spinner (LoaderCircle) + short status text while in flight.
- Prices in euros (€).

## Routing conventions

- Seller routes: `app/admin/[storeId]/`.
- Public routes: `app/shop/[storeSlug]/`, `app/cart/`, `app/order-confirmation/[id]/`.
- Treat URL params as untrusted - missing records get a safe empty/not-found state, never a crash.
- `@/` alias for all imports.

## Coding style

- Small typed functions, direct control flow.
- Match the file being edited.
- Page-specific logic stays local until reused elsewhere.
- No new dependency unless the platform genuinely lacks the capability.
- Never commit `.next/`, `node_modules/`, `*.tsbuildinfo`.
- Document env var names in `.env.example`; never commit secret values.

## Verification checklist

- `npm run typecheck`, `npm run lint` - always
- `npm run test` - after app-provider/validation/AI/route changes
- `npm run build` - for routing/config/dependency changes
- Manual browser check of the affected flow
- Scan changes: test all four modes, verify offline mock fallback
- Listing changes: confirm unpublished items stay off the storefront
- Order changes: test sufficient stock, insufficient stock, repeated acceptance
- Workflow changes: check both summary and node trace views
- Backend-persisted field changes: verify `types/index.ts` and `models.py` match

## Definition of done

- Satisfies `PRD.md` requirements
- Domain invariants intact
- Typecheck, lint, tests pass
- Affected flow manually exercised
- Types, schemas, backend models, Supabase schema updated where relevant
- No secrets, generated artifacts, or unrelated changes included
