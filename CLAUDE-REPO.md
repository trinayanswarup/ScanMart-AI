# CLAUDE-REPO.md - ScanMart AI

## What this is

ScanMart AI turns a product photo, barcode, text description, or receipt into structured inventory, a publishable storefront listing, and an auditable workflow trace. Built for ScanMart Retail Group - three store formats (salon, café, grocery) sharing one admin platform and one customer storefront.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test     # 70 tests
npm run build
```

Run typecheck + lint after every substantive change. Run test after touching app-provider, validation, AI logic, or routes. Run build for anything touching routing or config.

## Tech stack

| Concern       | Choice                                             |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 15 App Router, React 19, TypeScript strict |
| AI extraction | NVIDIA NIM - `meta/llama-3.2-11b-vision-instruct`  |
| OCR           | Tesseract.js, browser-side, 3-angle scan           |
| Barcode       | `@zxing/browser` → Open Food Facts                 |
| Styling       | Tailwind CSS 4, CSS custom properties (dark mode)  |
| Validation    | Zod                                                |
| Backend       | FastAPI + asyncpg (`scanmart-backend/`)            |
| Database      | Supabase Postgres                                  |
| Cart          | localStorage only (`scanmart_cart_v1`)             |
| Tests         | Vitest, jsdom + node environments                  |

Free-tier APIs only. Do not swap providers without discussion.

## Routes

```
app/
  page.tsx                       Landing page
  auth/page.tsx                  Admin login (hardcoded creds + demo bypass)
  admin/
    page.tsx                     Store picker
    [storeId]/                   Per-store seller dashboard, scan, inventory,
                                  orders, automations, settings
  shop/
    page.tsx                     Store directory
    [storeSlug]/page.tsx         Public storefront
  cart/page.tsx                  Multi-store cart and checkout
  order-confirmation/[id]/       Confirmation page
  api/extract/route.ts           NVIDIA NIM extraction endpoint
```

## Architecture

**Data split:** Postgres via the FastAPI backend holds all shared data - stores, inventory, listings, orders, workflows, executions. localStorage holds only the customer's cart, private per browser until checkout.

**State:** `AppProvider` (`components/app-provider.tsx`) fetches from `NEXT_PUBLIC_API_URL` on mount and exposes typed mutations. Per-store data loads lazily via `setCurrentStoreId`; `loadedStoreIdsRef` prevents duplicate fetches; `loadAllStores()` batch-loads for `/shop` and `/admin` index pages. `storeDataLoading` gates UI so counts don't flash zero before data arrives.

**setState timing gotcha:** in React 18+, a value assigned inside a `setState` updater is not visible to code after the `setState` call in the same function - the updater runs later. Validate against `state` _before_ calling `setState`, return the result, then mutate:

````

**Dark mode:** `ThemeProvider` toggles `.dark` on `<html>`. Always use CSS custom properties (`var(--canvas)`, `var(--surface)`, `var(--ink)`, `var(--line)`, `var(--brand)`, `var(--brand-soft)`) - never hard-coded colors.

**AI extraction:** `POST /api/extract` accepts `{ imageBase64?, mimeType?, ocrText?, userText?, businessType?, mode? }`. Strips markdown fences and leading prose before validating against `productAIExtractionSchema`. `mode: "receipt"` returns `{ items: [...] }` instead of one product. 55s timeout, falls back to `mockExtractProduct()` on failure.

**Scan modes:** Photo/Camera, Barcode, Text Entry, Receipt/Invoice - four independent tabs on `app/admin/[storeId]/scan/page.tsx`. Don't merge their state or handlers.

**Inventory/listings:** one listing per item max. `source: "ai_scan"` creates a draft listing + `PRODUCT_SCANNED` workflow execution server-side; `source: "manual"` does not. Publishing needs a title, description, and positive price.

**Orders - six invariants:**

1. Validate all line-item stock before any mutation
2. No partial mutations
3. Reduce stock exactly once
4. Persist `stock_reduced_at` for idempotency
5. Repeated "accepted" transitions never reduce stock again
6. Item name/quantity/price are creation-time snapshots

Enforced backend-side with `SELECT ... FOR UPDATE`.

**Workflows:** triggers are `PRODUCT_SCANNED`, `ORDER_ACCEPTED`, `LOW_STOCK_DETECTED`. Human-approval nodes stay `waiting_for_human` until the seller acts.

**Auth gate:** `app/auth/page.tsx` - hardcoded `admin@scanmart.eu` / `admin123` sets an `auth_mode=admin` cookie; "Enter Demo Workspace" sets `auth_mode=demo`. Demo-grade, not production auth.

**Eval harness:** `eval/` is standalone Python, not imported by the app. Run manually:

```bash
cd eval && python run_eval.py            # baseline
python run_eval.py --preprocess          # with image preprocessing
python report.py                         # accuracy by failure tag
````

Baseline on 22 real product photos: 41% overall, 68% name, 55% category. `scanmart-preprocess/` is a standalone FastAPI microservice sharing the preprocessing pipeline - not wired into the live scan page.

## Validation

All untrusted data - AI output, form input, URL params, external API responses - validated with Zod before entering state. Extend `lib/validation.ts`, don't re-declare.

## Tests

70 tests across `__tests__/`:

- `app-provider.test.tsx` - mutations via `renderHook` + `act`, mocked backend
- `ai.test.ts` - `confidenceLabel` boundaries, `lookupBarcode` cases
- `validation.test.ts` - schema edge cases
- `extract-route.test.ts` - route handler, `@vitest-environment node`

## Conventions

- Small typed functions, no premature abstraction
- `any` is never acceptable; narrow `unknown` explicitly
- `@/` import alias throughout
- No new dependencies without a concrete reason
- Prices in euros (€)
- Seller controls never appear in shop/cart/checkout routes
- Async buttons need a loading state: disabled + spinner + short status text
- Keep `types/index.ts` and `scanmart-backend/models.py` in sync when entity shapes change

## Session end

```bash
npm run typecheck && npm run lint && npm run test
npm run build   # if routes/layout/config changed
```

## Environment variables

```
# .env.local
NVIDIA_API_KEY=
NEXT_PUBLIC_API_URL=

# scanmart-backend/.env
DATABASE_URL=
```

Never commit secrets. Never put secrets in `NEXT_PUBLIC_` variables.
