# ScanMart AI

**Turn physical stock into inventory, storefronts, and automated workflows.**

ScanMart AI is an AI-native platform for small businesses that converts product scans into structured inventory, publishable storefront listings, and automated operational workflows.

The included demo is built around **Urban Glow Salon** and runs without authentication, Supabase, or a paid AI API.

## Why this is AI-native

AI is part of the product workflow rather than a chat box added beside it:

- Product images and label text produce strict structured output.
- Confidence determines how strongly the seller is prompted to review.
- Every extracted field remains editable.
- Corrections are retained as human-in-the-loop feedback.
- Confirmed scans trigger operational workflows.
- Every automation node records input, output, status, and timing.

ScanMart AI demonstrates AI-native product engineering: multimodal extraction, structured outputs, human-in-the-loop validation, workflow automation, execution traces, full-stack product delivery, and business-focused MVP thinking.

## Demo flow

1. Open the landing page and enter the demo dashboard.
2. Visit **Scan product**.
3. Upload a product image, use a webcam, take a mobile photo, or enter label text such as `Dove shampoo 500ml`.
4. Review and edit the structured AI result.
5. Confirm it and open the new inventory record.
6. Publish the draft listing.
7. Open the Urban Glow storefront and add the product to the cart.
8. Place an order request with a name and phone or email.
9. Return to **Orders** and accept it.
10. Observe reduced inventory and the resulting automation trace.

Demo data is persisted in `localStorage`. It can be reset from **Settings**.

## Tech stack

- Next.js App Router
- React and strict TypeScript
- Tailwind CSS
- Zod validation
- Supabase PostgreSQL, Auth, and Storage schema
- LocalStorage demo repository
- Deterministic mock AI provider
- Lucide icons

## Local setup

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Production checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment variables

Copy `.env.example` to `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=mock
GEMINI_API_KEY=
```

`AI_PROVIDER=mock` is the default and requires no external service. The mock recognizes shampoo, coffee, milk, biscuit/Parle, toothpaste, and wax from entered text or an uploaded filename.

## Database

- Apply [`supabase/schema.sql`](supabase/schema.sql) to create tables, constraints, indexes, RLS, and the product image bucket.
- Apply [`supabase/seed.sql`](supabase/seed.sql) to create business templates, the demo business, sample products, and predefined workflows.

Core entities include businesses, templates, inventory, listings, orders, scans, correction logs, workflows, workflow executions, node executions, seller tasks, and notifications.

## Core workflows

### Product scanned

Generate product description → create draft listing → request seller approval.

### Order accepted

Reduce stock → check low stock → notify seller.

### Low stock detected

Create seller task → notify seller.

Order acceptance is idempotent: stock is reduced only once, and an order with insufficient inventory is rejected.

## Screenshots

Add final portfolio captures here:

- Landing page
- AI scan and review
- Inventory dashboard
- Public storefront
- Order acceptance
- Automation execution trace

## Current MVP boundary

The MVP intentionally excludes payments, delivery routing, multi-tenant billing, visual workflow editing, supplier ordering, and marketplace aggregation.

