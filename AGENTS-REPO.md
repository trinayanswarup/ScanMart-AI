# AGENTS-REPO.md — AI Agent Operating Rules

> **Note:** The original AGENTS.md / CLAUDE.md / PRD.md files used during
> development are excluded from this repository (see .gitignore) as they
> contain internal working notes. This file summarizes the actual
> conventions and requirements that were followed.

---

This document describes the rules and guardrails that governed AI coding agents (Claude Code, Codex) working in this repository.

## Project overview given to agents

ScanMart AI is a Next.js 15 App Router application with two persistence layers: a browser `localStorage` runtime for the demo, and a PostgreSQL/Supabase schema as the intended production target. Agents were instructed not to describe Supabase as connected unless a task explicitly implemented that integration.

## Commands agents were required to know

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run test        # added during development; vitest run
```

Typecheck and lint were required to pass after every substantive change. Build was required for routing, configuration, or release-facing changes.

## Architecture rules enforced

### Client state

- `AppProvider` is the single source of truth for demo data.
- `useApp()` may only be called under `AppProvider`.
- State updates must be immutable; use functional `setState` updaters when deriving new state from current state.
- The versioned `localStorage` key (`scanmart_shared_v2`) must be preserved. Breaking changes require a migration or key bump.
- Browser-only APIs must remain in client components or browser-only code paths.

### Domain model

- `types/index.ts` is authoritative for all application entities.
- `lib/seed.ts`, `components/app-provider.tsx`, and relevant pages must stay consistent with type definitions.
- Supabase schema and seed files must be updated whenever a domain change belongs in the production model.
- Strict TypeScript throughout — `any` is not permitted; `unknown` must be narrowed explicitly.

### Validation

- All untrusted data — AI output, form input, URL parameters, external API responses — must be validated with Zod before entering application state.
- Reuse or extend schemas in `lib/validation.ts`.
- User-facing validation failures must be specific and actionable.

### AI behavior rules

- AI output is always reviewable and editable before being committed to state.
- Extraction results must preserve confidence score, detected text, and a short reasoning explanation.
- All output must validate against `productAIExtractionSchema`.
- Conservative output is preferred over invented detail when evidence is weak.
- The mock provider must remain deterministic so the demo works offline without external API access.
- Agents must not silently substitute a paid or network-dependent service for the mock.
- When output is corrected by a user, both the original and corrected values must be preserved if they differ materially.
- **API constraint:** Free-tier APIs only. The current production extractor is NVIDIA NIM (meta/llama-3.2-11b-vision-instruct), accessed via `app/api/extract/route.ts`.

### Inventory and listings

- Quantities and low-stock thresholds cannot be negative.
- Prices must be positive when supplied.
- Each inventory item may have at most one storefront listing.
- A confirmed AI scan creates an unpublished draft listing — it must not publish autonomously.
- Publishing requires a non-empty title, description, and positive price.
- The public storefront must show only published listings.
- Workflow executions for `PRODUCT_SCANNED` must only be created when `item.source === "ai_scan"`, not for manually entered items.

### Order acceptance invariants

1. Verify every line item has sufficient stock before mutating anything.
2. Do not apply partial stock reductions — if any line fails, abort the entire acceptance.
3. Reduce stock exactly once.
4. Persist the `stockReduced` marker with the accepted order to guarantee idempotency.
5. Repeated status changes must not reduce stock again.
6. Order item names and prices are creation-time snapshots and must never be mutated retroactively.

For production persistence, order acceptance must be implemented as a server-side transaction or atomic database function.

### Workflows

- Consequential automated actions must be visible in an execution trace.
- Each node execution must record input, output, status, error, and timestamp where applicable.
- Human-approval nodes must not report success until the user acts.
- Publishing through an approval step must still enforce listing validation (non-empty title/description, positive price).
- Existing execution status values must be reused; near-duplicate values must not be introduced.

## UI conventions enforced

- Match the existing visual language — do not introduce a new component system without justification.
- Reuse global CSS classes from `app/globals.css`: buttons, cards, inputs, grids, muted text, empty states.
- Use only Lucide icons already included in the project.
- All colors must use CSS custom properties (`var(--surface)`, `var(--canvas)`, `var(--ink)`, `var(--line)`, `var(--brand)`, `var(--brand-soft)`) — hard-coded hex values or color names break dark mode.
- Preserve responsive behavior at the existing `800px` navigation breakpoint.
- Seller dashboard controls must never appear in public storefront or checkout routes.
- Every interactive control needs a label or accessible name.
- Every state must be represented explicitly: empty, loading/waiting, success, and error.
- Prices are in Indian rupees in the current demo — do not mix currencies.

## Routing conventions

- Admin (seller) routes live under `app/admin/[storeId]/`.
- Public shopping routes live under `app/shop/[storeSlug]/`, `app/cart/`, and `app/order-confirmation/[id]/`.
- Dynamic route parameters are treated as untrusted — missing records must produce a safe not-found or empty state, never a crash.
- Use the `@/` path alias for all project imports.

## Coding style requirements

- Small, typed functions and direct control flow.
- Follow the formatting and patterns of the file being edited.
- Page-specific logic stays in the page until reused or difficult to reason about.
- Extract shared domain logic before duplicating it across pages.
- Do not add a dependency when the platform or an existing package covers the need.
- Never commit generated directories (`.next/`, `node_modules/`, `*.tsbuildinfo`).
- Environment variable names must be documented in `.env.example`; secret values must never be committed.

## Verification checklist (proportional to the change)

- `npm run typecheck` — always
- `npm run lint` — always
- `npm run test` — after any change to app-provider, validation, AI logic, or route handlers
- `npm run build` — for routing, configuration, dependency, or release-facing changes
- Manual browser verification of the affected user flow
- For scan changes: test text-only input and image/OCR fallback paths
- For listing changes: verify unpublished products stay off the storefront
- For order changes: test sufficient stock, insufficient stock, and repeated acceptance
- For workflow changes: inspect both the workflow summary view and the node trace detail
- After any state-shape or persistence change: reload to verify `localStorage` hydration

## Definition of done

A change is complete when:

- it satisfies the relevant requirements in `PRD.md`;
- all domain invariants above remain intact;
- TypeScript and lint checks pass;
- the affected end-to-end user flow has been manually exercised;
- types, seed data, validation schemas, and Supabase schema are updated where affected;
- no secrets, generated artifacts, or unrelated edits are included in the commit.
