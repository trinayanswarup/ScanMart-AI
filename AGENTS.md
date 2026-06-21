# AGENTS.md

This file gives coding agents the project-specific context and guardrails needed to work safely in ScanMart AI.

## Project at a glance

ScanMart AI is a Next.js App Router demo that converts product scans into inventory records, storefront listings, customer orders, and inspectable workflow executions.

The repository currently has two persistence layers:

- **Active demo runtime:** React context persisted to browser `localStorage`.
- **Production target:** the PostgreSQL/Supabase model in `supabase/schema.sql`.

Do not describe or treat Supabase as connected unless a task explicitly implements that integration.

## Commands

Run from the repository root:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

There is currently no automated test script. For behavior changes, run typecheck and lint at minimum, then build when practical. Manually exercise the affected user flow in the browser.

## Repository map

```text
app/                         Next.js routes and page-level UI
  (dashboard)/               Seller-only dashboard route group
  store/[storeSlug]/         Public storefront
  cart/                      Customer cart and checkout
  order-confirmation/[id]/   Customer confirmation
components/
  app-provider.tsx           Demo state, mutations, localStorage persistence
  dashboard-shell.tsx        Seller navigation and responsive shell
lib/
  ai.ts                      Deterministic structured product extraction
  seed.ts                    Initial local demo state and templates
  validation.ts              Zod schemas for AI, inventory, and checkout data
types/index.ts               Shared application domain types
supabase/
  schema.sql                 Production tables, constraints, indexes, RLS
  seed.sql                   Production-oriented templates and demo seed
PRD.md                       Product goals, requirements, and acceptance criteria
```

## Architecture rules

### Client state

- `AppProvider` is the current source of truth for demo data.
- Use `useApp()` only under `AppProvider`.
- Keep state updates immutable.
- Use functional `setState` updates when deriving new state from current state.
- Preserve the versioned `localStorage` key. If persisted state becomes incompatible, introduce an explicit migration or increment the key version.
- Code that accesses browser-only APIs must remain in a client component or browser-only path.

### Domain model

- Update `types/index.ts` when adding or changing application entities.
- Keep `lib/seed.ts`, `components/app-provider.tsx`, and relevant pages consistent with type changes.
- If the change belongs in the production model, update `supabase/schema.sql` and `supabase/seed.sql` as well.
- TypeScript uses strict mode. Avoid `any`; narrow `unknown` values explicitly.

### Validation

- Validate untrusted AI, form, URL-derived, and external data before committing it to state.
- Reuse or extend the Zod schemas in `lib/validation.ts`.
- User-facing validation failures should be specific and actionable.

### AI behavior

- AI output is always reviewable and editable.
- Preserve confidence, detected text, and a short explanation.
- Validate extraction against `productAIExtractionSchema`.
- Prefer conservative output over invented detail when evidence is weak.
- Keep the mock provider deterministic so the demo remains reproducible and offline-capable.
- Do not silently replace the mock provider with a paid or network-dependent service.
- When output is corrected, preserve the original and corrected values when they materially differ.

### Inventory and listings

- Quantities and low-stock thresholds cannot be negative.
- Supplied prices must be positive.
- Each inventory item may have at most one storefront listing.
- An AI-confirmed scan should create an unpublished draft, not publish autonomously.
- Publishing requires a title, description, and positive price.
- Public storefront pages must show only published listings.

### Orders

Order acceptance has critical invariants:

1. Verify every line has sufficient stock before mutating anything.
2. Do not apply partial stock reductions.
3. Reduce stock exactly once.
4. Persist the stock-reduction marker with the accepted state.
5. Repeated status changes must not reduce stock again.
6. Keep order item names and prices as creation-time snapshots.

For production persistence, implement acceptance as a server-side transaction or atomic database function rather than a sequence of independent client writes.

### Workflows

- Consequential automated actions must remain visible in an execution trace.
- Preserve ordered node executions with input, output, status, error, and timestamp data where relevant.
- Human-approval nodes must not report success until the user acts.
- Publishing through approval must still enforce listing validation.
- Use existing execution status values rather than introducing near-duplicates.

## UI conventions

- Match the existing visual language before introducing a new component system.
- Reuse global classes from `app/globals.css` such as buttons, cards, inputs, grids, muted text, and empty states.
- Use Lucide icons already included in the project.
- Preserve responsive behavior at and below the existing `800px` navigation breakpoint.
- Keep seller dashboard controls out of public storefront and checkout routes.
- Provide labels for inputs and accessible names for icon-only controls.
- Include clear empty, waiting, success, and error states.
- The current demo displays prices in Indian rupees. Do not mix currencies within a flow.

## Routing conventions

- Seller routes belong under `app/(dashboard)/`.
- Public shopping routes remain outside the dashboard route group.
- Use dynamic route parameters for entity detail pages.
- Treat URL parameters as untrusted: handle missing records with a safe not-found or empty state.
- Use the `@/` path alias for project imports.

## Coding style

- Prefer small, typed functions and direct control flow.
- Follow the formatting and patterns of the file being edited.
- Keep page-specific behavior in the page until it is reused or becomes difficult to reason about.
- Extract shared domain logic before duplicating it across pages.
- Do not add a dependency when the platform or an existing package already covers the need.
- Do not commit generated directories or files such as `.next/`, `node_modules/`, or `tsconfig.tsbuildinfo`.
- Keep environment variable names documented in `.env.example`; never commit secret values.

## Verification checklist

Choose checks in proportion to the change:

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build` for routing, configuration, dependency, or release-facing changes.
- Manually verify the affected flow.
- For scan changes, test text-only input and image/OCR fallback behavior.
- For listing changes, verify unpublished products stay off the storefront.
- For cart changes, verify quantity updates and totals.
- For order changes, verify sufficient stock, insufficient stock, and repeated acceptance.
- For workflow changes, inspect both the workflow summary and node trace.
- Reload once to verify `localStorage` hydration when state shape or persistence changes.

## Definition of done

A change is done when:

- it satisfies the relevant requirements in `PRD.md`;
- domain invariants above remain intact;
- TypeScript and lint checks pass;
- the relevant end-to-end user flow has been exercised;
- documentation, seed data, validation, types, and Supabase schema are updated where the change affects them;
- no secrets, generated artifacts, or unrelated user changes are included.
