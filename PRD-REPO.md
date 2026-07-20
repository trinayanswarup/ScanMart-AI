# PRD-REPO.md — Product Requirements Overview

> **Note:** The original AGENTS.md / CLAUDE.md / PRD.md files used during
> development are excluded from this repository (see .gitignore) as they
> contain internal working notes. This file summarizes the actual
> conventions and requirements that were followed.

---

## Product summary

ScanMart AI turns a photo or text description of a physical product into structured inventory, a publishable storefront listing, and traceable operational workflows. It is designed for small inventory-based businesses — initially salons, cafés, and neighborhood grocery stores — that need to digitize stock without adopting a complex ERP.

The current implementation is a self-contained demo that works without authentication, a database, or a paid AI API. A Supabase schema is included as the intended production data model.

## Problem

Small businesses track stock manually or inconsistently. Existing tools fail these users because they require too much manual data entry, separate inventory and selling into different systems, hide automation behavior, treat AI output as final rather than reviewable, and are too expensive or complex for small teams.

## Product vision

Give a small-business owner one reliable flow:

> Scan a product → verify what the system understood → add it to inventory → publish it for sale → let visible automations handle routine follow-up.

AI reduces work without taking control away from the seller. Every generated field is editable, uncertainty is visible, and every consequential action is traceable.

## Target users

- **Owner-operator** — receives physical stock, manages inventory, and handles customer requests. Values speed and clarity over configuration.
- **Staff member** — scans products, corrects extracted fields, updates quantities, or processes incoming orders.
- **Customer** — browses a business's public storefront, adds available products to a cart, and submits an order request using name plus phone number or email.

## Core user journeys

### 1. Scan and add a product

The seller uploads an image, takes a photo, uses a webcam, or enters label text. OCR and the AI extraction provider return a structured result showing detected text, extracted fields, a confidence score, and a short explanation. The seller corrects any field and confirms. The system creates an inventory item and, for AI scans, a draft listing and a workflow execution waiting for seller approval.

### 2. Review and publish a listing

The seller opens the product or a pending automation, verifies the title, description, and price, then publishes directly or approves through the waiting workflow step. The listing becomes visible on the public storefront and the workflow trace records the completed approval.

### 3. Place an order request

A customer browses the storefront, adds published listings to a cart, adjusts quantities, enters their name and contact information, and submits. The system creates a new order and clears the cart. The customer sees an order confirmation.

### 4. Accept an order

The seller opens a new order. The system verifies sufficient stock for every line item. If any item is short, acceptance fails without changing inventory. If all items are available, the order is accepted and stock is reduced exactly once. A workflow trace records stock reduction, low-stock checking, and seller notification.

### 5. Reset the workspace

The seller can reset all data to the original seeded state from the Settings page.

## Functional requirements

### AI extraction

- Accept image upload, drag-and-drop, camera capture, or manual text input.
- Run OCR in the browser when an image is supplied.
- Validate all extraction output against a strict schema before accepting it.
- Produce: product name, optional brand, category, description, suggested unit and quantity, optional price, confidence (0–1), detected text fragments, and a short reasoning explanation.
- Label confidence as high (≥ 0.8), needs review (0.6–0.79), or manual correction required (< 0.6).
- Every extracted field must be editable before saving — low confidence never blocks correction.
- Retain original and corrected values when they differ.
- Fall back to a deterministic mock extractor when no external provider is configured.

### Inventory

- Create items manually or from an AI scan.
- Reject negative quantities and low-stock thresholds; require positive prices.
- Show low-stock state when quantity reaches or falls below the item's threshold.
- Support draft, active, and archived status values.

### Listings and storefront

- One listing per inventory item maximum.
- AI-confirmed scans create an unpublished draft listing — autonomous publishing is not permitted.
- Publishing requires a non-empty title, description, and positive price.
- Only published listings appear on the public storefront.
- Storefronts are resolved by the business's URL-safe slug.

### Cart and checkout

- Add published listings to a cart; increase, decrease, or remove quantities.
- Calculate line totals and the order total from listing prices at the time of checkout.
- Require the customer's name plus at least one contact method (phone or valid email).
- Snapshot each order item's name, quantity, and price at creation — prices must not drift after the order is placed.
- Clear the cart after a successful order request.
- No payment collection in the MVP; orders use pay-at-pickup or cash-on-delivery messaging.

### Orders

- Supported statuses: `new`, `accepted`, `completed`, `cancelled`.
- Validate all line items atomically before accepting — no partial inventory mutations.
- Reduce stock only on the first successful acceptance; persist a marker to guarantee idempotency.
- Subsequent status changes must not reduce stock again.

### Workflow automation

- Support trigger-based workflows: `PRODUCT_SCANNED`, `ORDER_ACCEPTED`, `LOW_STOCK_DETECTED`.
- Record a workflow execution with trigger, status, start time, and ordered node executions.
- Record each node's name, type, status, input, output, error, and timestamp.
- Human-approval steps remain actionable until the seller acts.
- Require a valid positive listing price before an approval can publish a listing.
- Execution traces must be readable to a non-technical seller.

### Persistence

- Demo state persists to `localStorage` under a versioned key.
- Hydrate client state before treating persisted data as authoritative.
- Fall back to seed data when stored data is absent or invalid.
- Supabase schema is the production persistence contract (not yet connected).

## UX requirements

- The seller navigation must expose: overview, inventory, scanning, orders, automations, settings, manual product entry, and storefront preview.
- Empty, loading, success, waiting, and failure states must be explicit throughout the UI.
- AI output must be presented as a suggestion to review, not as unquestioned truth.
- Destructive or consequential actions must give immediate feedback.
- Prices use Indian rupees in the current demo.
- Seller-only controls must not appear on public storefront or checkout pages.
- Accessibility basics required: labeled inputs, meaningful button labels, keyboard-operable controls, sufficient visual contrast.
- The dashboard must remain usable on mobile and desktop.

## Non-goals for the MVP

- Online payments or payment reconciliation
- Delivery routing and logistics
- Marketplace aggregation or multi-vendor selling
- Supplier purchase orders
- Accounting or tax reporting
- Multi-location inventory management
- A visual drag-and-drop workflow builder
- Model training from correction logs
- Full production authentication and Supabase integration

## Non-functional requirements

- Strict TypeScript must remain enabled throughout the codebase.
- All AI and form data must be runtime-validated before entering application state.
- Core order and inventory operations must be deterministic and idempotent.
- The demo must work without network access after dependencies are installed.
- API secrets must never be exposed through `NEXT_PUBLIC_` variables.
- Production checks must pass: `npm run typecheck`, `npm run lint`, `npm run build`.
- The application must remain responsive at common mobile and desktop widths.

## Delivery phases

| Phase | Scope | Status |
|---|---|---|
| 1 — Demo MVP | localStorage persistence, mock AI fallback, full UI, inventory, listings, cart, orders, workflow traces | **Complete** |
| 2 — Production foundation | Supabase client and auth, image storage, server-side mutations, transactional order acceptance | Planned |
| 3 — Intelligence and operations | Configurable multimodal provider, correction-based evaluation dataset, background workflow runner, operational analytics | Planned |
| 4 — Commercial expansion | Multi-staff roles, supplier workflows, payments, fulfillment integrations, configurable workflow editing | Planned |

## MVP acceptance criteria

The MVP is ready when:

- a user can scan or describe a product and receive validated structured output;
- extracted fields are editable and the result can be saved as inventory;
- an AI-confirmed scan creates a draft listing and a waiting workflow execution;
- a valid listing can be published and appears on the public storefront;
- a customer can submit an order request with valid contact information;
- accepting an in-stock order reduces inventory once and records a successful workflow trace;
- accepting an under-stocked order changes neither order status nor inventory;
- repeated acceptance does not reduce stock again;
- demo state survives page reload and can be reset to the seeded state;
- `npm run typecheck`, `npm run lint`, and `npm run build` all pass.
