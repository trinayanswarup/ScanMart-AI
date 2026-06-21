# ScanMart AI Product Requirements Document

## 1. Product summary

ScanMart AI turns a photo or text description of a physical product into structured inventory, a publishable storefront listing, and traceable operational workflows.

The initial product is designed for small, inventory-based businesses—starting with salons, cafés, and neighborhood grocery stores—that need a simpler way to digitize stock and handle lightweight commerce without adopting a complex ERP.

The current repository implements a self-contained demo for **Urban Glow Salon**. It uses browser `localStorage` and a deterministic mock AI provider so the complete experience works without authentication, a database, or a paid AI API. A Supabase schema is included as the intended production data model.

## 2. Problem

Small businesses often track stock manually or inconsistently. Adding an item may require typing product details into several places, creating a separate storefront listing, and remembering follow-up tasks such as checking low stock.

Existing inventory systems commonly fail these users because they:

- require too much manual data entry;
- separate inventory, selling, and operations into different tools;
- hide automation behavior or make it difficult to audit;
- treat AI output as final instead of reviewable;
- are too expensive or complex for a small team.

## 3. Product vision

Give a small-business owner one reliable flow:

> Scan a product, verify what the system understood, add it to inventory, publish it for sale, and let visible automations handle routine follow-up.

AI should reduce work without taking control away from the seller. Every generated field must be editable, uncertainty must be visible, and consequential actions must be traceable.

## 4. Goals

### MVP goals

- Convert a product image, camera capture, or label text into structured product data.
- Show extraction confidence and require human review before confirmation.
- Create and maintain inventory records.
- Generate a storefront draft from an AI-confirmed scan.
- Let the seller review and publish listings.
- Let customers add published products to a cart and submit an order request.
- Let the seller accept, complete, or cancel an order.
- Reduce stock exactly once when an order is accepted.
- Detect low stock after a sale.
- Display workflow and node-level execution traces.
- Keep the demo fully usable without external services.

### Business goals

- Demonstrate a credible AI-native workflow rather than a standalone chatbot.
- Reduce the time and typing required to digitize a new product.
- Give small-business owners a clear path from stock intake to a customer order.
- Establish a production-ready domain model that can migrate from local demo storage to Supabase.

## 5. Non-goals for the MVP

- Online payments or payment reconciliation
- Delivery routing and logistics
- Marketplace aggregation
- Supplier purchase orders
- Accounting or tax reporting
- Multi-location inventory
- Multi-tenant billing
- A visual drag-and-drop workflow builder
- Autonomous publishing without seller review
- Model training from correction logs
- Full production authentication and Supabase repository integration

## 6. Target users

### Primary: owner-operator

A salon, café, or grocery owner who receives physical stock, manages inventory, and handles customer requests. They value speed and clarity over advanced configuration.

### Secondary: staff member

An employee who scans products, corrects extracted fields, updates quantities, or processes incoming orders.

### Customer

A shopper who browses a business's public storefront, adds available products to a cart, and submits an order request using a name plus phone number or email.

## 7. Core user journeys

### 7.1 Scan and add a product

1. The seller opens **Scan product**.
2. They upload an image, take a photo, use a webcam, or enter label text.
3. OCR and the extraction provider return a structured result.
4. The UI shows detected text, extracted fields, confidence, and a short explanation.
5. The seller corrects any field and confirms the result.
6. The system creates an inventory item and records meaningful corrections.
7. For an AI scan, the system creates a draft listing and a workflow execution waiting for seller approval.

### 7.2 Review and publish a listing

1. The seller opens the product or pending automation.
2. They verify the title, description, and positive price.
3. They publish the listing directly or approve the waiting workflow.
4. The listing becomes visible on the public storefront.
5. The workflow trace records the completed approval.

### 7.3 Place an order request

1. A customer opens the business storefront.
2. They add one or more published listings to the cart.
3. They adjust quantities and enter their name plus a phone number or email.
4. They submit the request.
5. The system creates a new order and clears the cart.
6. The customer sees an order confirmation.

### 7.4 Accept an order

1. The seller opens a new order.
2. The system verifies sufficient stock for every line item.
3. If stock is insufficient, acceptance fails without changing inventory.
4. If stock is sufficient, the order becomes accepted and stock is reduced once.
5. The order is marked so repeated acceptance cannot reduce stock again.
6. A workflow trace records stock reduction, low-stock checking, and seller notification.

### 7.5 Reset the demo

1. The seller opens **Settings**.
2. They reset demo data.
3. The app restores the seeded Urban Glow Salon state.

## 8. Functional requirements

### 8.1 Business onboarding and settings

- Support `salon`, `cafe`, and `grocery` business types.
- Store a business name, URL-safe slug, type, and default low-stock threshold.
- Show type-specific category templates.
- Allow demo data to be reset to the repository seed.

### 8.2 Product capture and AI extraction

- Accept an image upload, drag-and-drop file, camera capture, or manual label text.
- Run OCR in the browser when an image is supplied.
- Validate extraction output against a strict schema.
- Produce:
  - product name;
  - optional brand;
  - category and optional subcategory;
  - description;
  - suggested unit, quantity, and optional price;
  - confidence from `0` to `1`;
  - detected text;
  - a short explanation.
- Label confidence as:
  - high confidence at `0.8` or above;
  - needs review from `0.6` to below `0.8`;
  - manual correction required below `0.6`.
- Keep every extracted field editable before saving.
- Never block manual correction because of low confidence.
- Retain original and corrected outputs when they differ.
- Default to the deterministic mock provider when no external provider is configured.

### 8.3 Inventory

- Create inventory manually or from an AI scan.
- Store name, brand, category, description, quantity, unit, threshold, price, image, source, confidence, and status.
- Reject negative quantity and threshold values.
- Require a positive price when a price is supplied.
- Show low-stock state when quantity is at or below the item's threshold.
- Allow product details and stock values to be edited.
- Support draft, active, and archived statuses in the domain model.

### 8.4 Listings and storefront

- Maintain at most one listing per inventory item.
- Create an unpublished draft listing for a confirmed AI scan.
- Require a non-empty title and description and a positive price before publishing.
- Keep listing edits synchronized to the associated inventory name, description, and price where the current demo uses a shared edit.
- Show only published listings on the public storefront.
- Resolve storefronts using the business slug.
- Preserve listing references in cart and order line items.

### 8.5 Cart and checkout

- Add published listings to a cart.
- Increase, decrease, or remove cart quantities.
- Calculate line totals and the order total from listing prices.
- Require the customer's name.
- Require at least one contact method: phone or valid email.
- Create an order with a snapshot of each item's name, quantity, and price.
- Clear the cart after a successful order request.
- The MVP uses pay-at-pickup or cash-on-delivery messaging and does not collect payment.

### 8.6 Orders

- Support `new`, `accepted`, `completed`, and `cancelled` statuses.
- Validate all stock before accepting an order.
- Apply no partial inventory update when any line lacks stock.
- Reduce stock only on the first successful transition to accepted.
- Preserve a `stockReduced`/`stock_reduced_at` marker for idempotency.
- Permit later status changes without reducing stock again.
- Keep order totals and item price snapshots stable after creation.

### 8.7 Workflow automation and observability

- Support trigger-based workflows, initially:
  - `PRODUCT_SCANNED`;
  - `ORDER_ACCEPTED`;
  - `LOW_STOCK_DETECTED`.
- Record a workflow execution with status, trigger, start time, and ordered node executions.
- Record each node's name, type, status, input, output, error, and timestamp where applicable.
- Support `running`, `success`, `failed`, `waiting_for_human`, and `skipped` execution states in the application domain.
- Make waiting human-approval steps actionable.
- Require a valid positive listing price before approval can publish a listing.
- Keep execution traces readable to a non-technical seller.

### 8.8 Persistence

- Persist demo state to `localStorage` under a versioned key.
- Hydrate client state before treating persisted data as authoritative.
- Fall back to seed data when stored data is absent or invalid.
- Use the Supabase schema as the production persistence contract.
- Enforce tenant ownership and public-listing access with row-level security in production.

## 9. UX requirements

- The main seller navigation must expose overview, inventory, scanning, orders, automations, settings, manual product entry, and storefront preview.
- The dashboard must remain usable on desktop and mobile.
- Empty, loading, success, waiting, and failure states must be explicit.
- AI output must be presented as a suggestion to review, not as unquestioned truth.
- Destructive or consequential actions must give immediate feedback.
- Prices use Indian rupees in the current demo.
- Public storefront and checkout must not expose seller-only controls.
- Accessibility basics are required: labeled inputs, meaningful button labels, keyboard-operable controls, and sufficient visual contrast.

## 10. Data model

The core entities are:

- `Business`
- `BusinessTemplate`
- `InventoryItem`
- `ProductListing`
- `Order` and `OrderItem`
- `ScanEvent`
- `AICorrectionLog`
- `Workflow`
- `WorkflowExecution`
- `WorkflowNodeExecution`
- `SellerTask`
- `Notification`

The TypeScript demo model lives in `types/index.ts`. The production-oriented relational model lives in `supabase/schema.sql`.

## 11. Success metrics

Metrics should be added when production persistence and analytics are connected.

### Activation

- Percentage of onboarded businesses that confirm a first scan.
- Median time from opening scan to saved inventory item.
- Percentage of scans that result in a published listing.

### AI quality

- Field-level correction rate.
- Percentage of extractions in each confidence band.
- Percentage of scans abandoned or replaced with manual entry.
- OCR failure and schema-validation failure rates.

### Commerce

- Storefront visit-to-cart rate.
- Cart-to-order-request conversion rate.
- Order acceptance rate.
- Percentage of acceptance attempts blocked by insufficient stock.

### Automation reliability

- Workflow and node success rates.
- Time spent waiting for human approval.
- Duplicate stock-reduction incidents, with a target of zero.

## 12. Non-functional requirements

- Strict TypeScript must remain enabled.
- AI and form data must be runtime-validated before entering application state.
- Core order and inventory operations must be deterministic and idempotent.
- The demo must work without network access after dependencies are installed.
- Secrets must never be exposed through `NEXT_PUBLIC_` variables.
- Production checks must pass:

```bash
npm run typecheck
npm run lint
npm run build
```

- The application should remain responsive at common mobile and desktop widths.
- Production storage must use authorization policies appropriate to seller-owned data and public storefront reads.

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| OCR produces noisy or misleading text | Normalize common OCR errors, expose detected text, show confidence, and require review. |
| AI invents product details | Use strict structured output, editable fields, conservative fallbacks, and correction logging. |
| An accepted order reduces stock more than once | Check and persist the stock-reduction marker before mutation. |
| Partial stock mutation occurs | Validate all order lines before applying any quantity changes. |
| Demo and production models drift | Keep TypeScript types and Supabase schema aligned during domain changes. |
| Browser state becomes invalid | Catch hydration errors and restore the seeded demo state. |
| Automation feels opaque | Preserve node-level inputs, outputs, statuses, errors, and timestamps. |

## 14. Delivery phases

### Phase 1: demo MVP — current scope

- Local demo persistence
- Deterministic extraction and browser OCR
- Inventory and listing management
- Public storefront, cart, and order requests
- Order-driven stock updates
- Inspectable workflow traces

### Phase 2: production foundation

- Supabase client and repository layer
- Authentication and business ownership
- Product image storage
- Server-side mutations and transactional order acceptance
- Real scan events and correction logs
- Seller tasks and notifications

### Phase 3: intelligence and operations

- Configurable external multimodal provider
- Evaluation dataset based on consented corrections
- Improved category and pricing suggestions
- Background workflow runner with retries
- Operational analytics and alerting

### Phase 4: commercial expansion

- Multiple staff roles and locations
- Supplier and purchase-order workflows
- Payments and fulfillment integrations
- Configurable workflow editing

## 15. MVP acceptance criteria

The MVP is ready for demonstration when:

- a user can scan or describe a product and receive validated structured output;
- the user can edit and save that output as inventory;
- an AI-confirmed scan creates a draft listing and waiting workflow trace;
- a valid listing can be published and appears on the storefront;
- a customer can submit an order request with valid contact information;
- accepting an in-stock order reduces inventory once and records a successful trace;
- accepting an under-stocked order changes neither status nor inventory;
- repeated acceptance does not reduce stock again;
- demo state survives reload and can be reset;
- typecheck, lint, and production build all pass.
