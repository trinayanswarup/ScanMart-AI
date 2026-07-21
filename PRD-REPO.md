# ScanMart AI - Product Requirements

## Summary

ScanMart AI turns a product photo, barcode, text description, or receipt into structured inventory, a publishable storefront listing, and a traceable workflow. Built for ScanMart Retail Group - three store formats (salon, café, grocery) sharing one admin platform and one customer storefront, backed by a real FastAPI + Supabase Postgres backend. The customer cart lives in localStorage, private per browser until checkout. A demo access gate (`app/auth/page.tsx`) lets reviewers explore without real credentials.

## Problem

Small businesses track stock manually or inconsistently. Existing tools require too much manual entry, separate inventory from selling, hide automation behavior, treat AI output as final rather than reviewable, and are too complex or expensive for small teams.

## Vision

> Scan a product → verify what the system understood → add it to inventory → publish it for sale → let visible automations handle the rest.

AI reduces work without taking control from the seller. Every generated field is editable, uncertainty is visible, every consequential action is traceable.

## Users

- **Owner-operator** - manages inventory and customer requests, values speed over configuration
- **Staff** - scans products, corrects fields, processes orders
- **Customer** - browses the storefront, orders with name + phone/email

## Core journeys

1. **Scan and add a product** - choose a mode (photo, barcode, text, receipt), review AI extraction with confidence score, correct if needed, save. AI-scanned items get a draft listing awaiting approval.
2. **Receipt/invoice bulk import** - upload a receipt photo, review the extracted line-item table, select rows, bulk-add.
3. **Review and publish** - verify title/description/price, publish or approve through the pending workflow.
4. **Place an order** - browse, add to cart (may span multiple stores), submit with contact info.
5. **Accept an order** - backend validates stock atomically; accepting reduces stock exactly once.
6. **Reset the workspace** - restores the seeded 3-store demo state.

## Functional requirements

### AI extraction

- Accept photo, camera capture, manual text, or receipt/invoice.
- Browser OCR (3-angle) and barcode detection run before the AI call.
- Output validated against a strict schema: product name, brand, category, description, unit, quantity, price, confidence (0–1), detected text, reasoning.
- Confidence bands: high ≥ 0.8, needs review 0.6–0.79, manual correction < 0.6.
- Every field stays editable regardless of confidence.
- Original and corrected values both retained when they differ.
- Captured photos persist as the product image.
- Falls back to a deterministic mock extractor with no API key.

### Inventory

- Manual or AI-scan creation.
- Quantities/thresholds never negative; prices positive when supplied.
- Low-stock state shown at or below threshold.
- Draft, active, archived statuses.

### Listings and storefront

- One listing per item max.
- AI scans create unpublished drafts - no autonomous publishing.
- Publishing needs title, description, positive price.
- Only published listings appear on the storefront, resolved by store slug.

### Cart and checkout

- Cart in localStorage, private per browser.
- Multi-store carts, checkout splits into one order per store.
- Requires customer name + phone or email.
- Order items snapshot name/quantity/price at creation time.
- Cart clears after successful order.
- Euros (€). No payment collection - pay-at-pickup / cash-on-delivery only.

### Orders

- Statuses: new, accepted, completed, cancelled.
- Backend validates all line-item stock atomically before accepting.
- Stock reduces exactly once, guarded by a `stock_reduced_at` marker.
- Later status changes never reduce stock again.

### Workflows

- Triggers: `PRODUCT_SCANNED`, `ORDER_ACCEPTED`, `LOW_STOCK_DETECTED`.
- Each execution records trigger, status, start time, ordered nodes.
- Each node records name, type, status, input, output, error, timestamp.
- Human-approval nodes stay actionable until the seller acts.
- Approval requires a valid positive listing price.

### Persistence

- Shared data lives in Supabase Postgres, served through the FastAPI backend.
- Cart lives in localStorage only, never sent to the backend until checkout.
- Schema: `supabase/schema.sql` + `supabase/schema_additions.sql`.

## UX requirements

- Seller nav: overview, inventory, scanning, orders, automations, settings, manual entry, storefront preview.
- Explicit empty, loading, success, waiting, error states - including loading states on async buttons.
- AI output presented as a suggestion, never unquestioned truth.
- Prices in euros throughout.
- Seller controls never appear on public/checkout pages.
- Labeled inputs, keyboard operability, sufficient contrast.
- Full dark mode support.
- Usable at mobile and desktop widths.

## Non-goals

Payments, delivery routing, marketplace aggregation, supplier POs, accounting/tax, multi-location inventory, drag-and-drop workflow builder, model training from corrections, full production auth (current gate is demo-grade).

## Non-functional requirements

- Strict TypeScript throughout.
- All AI/form data runtime-validated before entering state.
- Order/inventory operations deterministic and idempotent.
- Works without a paid AI key (mock fallback).
- No secrets in `NEXT_PUBLIC_` variables.
- `npm run typecheck`, `lint`, `test`, `build` all pass before release.
- Stock/order mutations atomic at the database level.

## Delivery phases

| Phase                     | Scope                                                                                           | Status      |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ----------- |
| 1 - MVP                   | 4 scan modes, inventory, listings, cart, orders, workflow traces                                | Complete    |
| 2 - Production foundation | FastAPI + Postgres backend, atomic orders, real auth, image storage, background workflow runner | In progress |
| 3 - Intelligence          | Configurable AI provider, eval-driven accuracy improvements, analytics                          | Planned     |
| 4 - Commercial expansion  | Multi-staff roles, supplier workflows, payments, fulfillment                                    | Planned     |

## Acceptance criteria

- Scan or describe a product → validated structured output.
- Fields editable, savable as inventory (persisted to Postgres).
- AI-confirmed scans create a draft listing + waiting workflow.
- Published listings appear on the storefront.
- Orders accepted with valid contact info.
- In-stock acceptance reduces inventory once with a successful trace.
- Under-stocked acceptance changes nothing.
- Repeated acceptance never double-reduces stock.
- `typecheck`, `lint`, `test`, `build` all pass.
