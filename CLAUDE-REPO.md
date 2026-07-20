# CLAUDE-REPO.md — Project Context for Claude Code

> **Note:** The original AGENTS.md / CLAUDE.md / PRD.md files used during
> development are excluded from this repository (see .gitignore) as they
> contain internal working notes. This file summarizes the actual
> conventions and requirements that were followed.

---

This document summarizes the project context and conventions stored in `CLAUDE.md` — the instructions given to Claude Code to orient it in this repository across sessions.

## What this project is

ScanMart AI converts a product photo or label text into a structured inventory record, a publishable storefront listing, and an auditable workflow execution trace. It targets small inventory-based businesses (salons, cafés, grocery stores) that need to digitize stock without adopting a complex ERP.

The application is a self-contained demo: it runs entirely in the browser with `localStorage` as the persistence layer and a deterministic mock AI extractor as the offline fallback. A Supabase schema is included as the planned production data model but is not yet wired to the client.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router, React 19 |
| Language | TypeScript 5.7, strict mode |
| AI extraction | NVIDIA NIM — `meta/llama-3.2-11b-vision-instruct` |
| OCR | Tesseract.js 7 (browser-side, three-angle scan) |
| Barcode | `@zxing/browser` → Open Food Facts API |
| Styling | Tailwind CSS 4, Lucide React, CSS custom properties |
| Validation | Zod 3 |
| Tests | Vitest 4, `@testing-library/react` |
| Storage | `localStorage` (demo) · Supabase (production schema) |

**Note on the AI provider:** The repository's README mentions Gemini, but the extraction endpoint (`app/api/extract/route.ts`) uses NVIDIA NIM. NVIDIA's free tier was selected to keep the project accessible without a billing account.

## Route structure

Admin (seller) routes are scoped under `app/admin/[storeId]/` — the `storeId` dynamic segment identifies which business the seller is managing. Public routes (`app/shop/`, `app/cart/`, `app/order-confirmation/`) are kept completely separate from admin routes and must never expose seller-only controls.

Key admin pages: dashboard, inventory list, inventory/new (scan or manual), product detail, scan flow, orders list, order detail, automations list, execution detail, settings.

Key public pages: store directory, individual storefront (`[storeSlug]`), cart and checkout, order confirmation.

The extraction API lives at `app/api/extract/route.ts` and is the only server-side route.

## State management

All application state lives in `AppProvider` (`components/app-provider.tsx`) and is consumed via `useApp()`. Mutations are `useCallback` functions that call React's `setState` with a functional updater for immutability. State is serialized to `localStorage` under a versioned key on every change and rehydrated on mount.

**Key architectural constraint identified during development:** In React 18+ concurrent mode, `setState(updater)` schedules the updater to run during the next render — after the enclosing function has already returned its value. This means mutations that need to return a result (success/failure) to the caller must validate synchronously against the current `state` snapshot *before* calling `setState`, not inside the updater. Returning a value assigned inside an updater will always return the initial value. The `useCallback` dependency array must include `state` when the function reads from it for validation.

## Dark mode

`ThemeProvider` toggles the `.dark` class on `<html>`. All colors in both component inline styles and CSS classes must use CSS custom properties:

- `var(--canvas)` — page background
- `var(--surface)` — card and input backgrounds
- `var(--ink)` — primary text
- `var(--ink-muted)` — secondary/muted text
- `var(--line)` — borders and dividers
- `var(--brand)` — brand green
- `var(--brand-soft)` — light green tint (replaces hard-coded `#F0FAF5`)

Hard-coded hex values (`#ffffff`, `#F0FAF5`, etc.) break dark mode and were systematically replaced during development.

## Validation

All external data — AI model output, user form input, URL parameters, Open Food Facts API responses — is validated with Zod before entering application state. Schemas live in `lib/validation.ts`. The primary schema is `productAIExtractionSchema`, which enforces non-empty strings, confidence bounds (0–1), and coerces numeric fields.

## Test suite

54 tests across four files in `__tests__/`:

- `app-provider.test.tsx` — all state mutations (addToCart, placeOrder, updateOrderStatus, addInventory) tested via `renderHook` + `act`
- `ai.test.ts` — `confidenceLabel` boundary values, `lookupBarcode` network and not-found cases
- `validation.test.ts` — `productAIExtractionSchema` valid and invalid payloads
- `extract-route.test.ts` — route handler error paths, JSON cleaning (markdown fences, leading prose), missing API key

Route handler tests declare `// @vitest-environment node` at the file level to run in Node instead of jsdom. The global setup (`vitest.setup.ts`) guards `localStorage.clear()` behind a `typeof localStorage !== "undefined"` check for the same reason.

## Conventions followed

- Strict TypeScript — `any` is never used; `unknown` is narrowed explicitly.
- Direct control flow — small typed functions, no premature abstraction.
- CSS custom properties — never hard-code colors in components.
- Source gating — workflow executions are only created for `source === "ai_scan"` inventory items, not manually entered ones.
- Order invariants — stock is validated atomically across all line items before any mutation; `stockReduced` persists to prevent double-deduction.
- Free-tier APIs only — NVIDIA NIM (extraction), Open Food Facts (barcode lookup), Tesseract.js (local OCR).
- No secrets in `NEXT_PUBLIC_` variables.
- The `@/` path alias is used for all project imports.

## Session-end checklist

```bash
npm run typecheck   # must pass
npm run lint        # must pass
npm run test        # must pass (54 tests)
npm run build       # run if routes, layouts, or config changed
```
