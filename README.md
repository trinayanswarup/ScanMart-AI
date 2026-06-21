# ScanMart AI

Active MVP: AI-native inventory, storefront, and workflow automation platform for small businesses.

ScanMart AI helps small businesses turn product scans into structured inventory records, publishable storefront listings, and simple operational workflows. Sellers can scan a product image or enter label text, review the extracted product details, confirm the item into inventory, publish it to a mini storefront, and manage customer orders from one dashboard.

AI is part of the product workflow rather than a chat box added beside it.

---

## What it does

ScanMart AI is built around a simple business flow:

1. A seller scans a product image or enters label text.
2. The system extracts structured product details.
3. The seller reviews and edits the result.
4. The product is saved into inventory.
5. The seller can publish it to a storefront.
6. Customers can place orders.
7. Order and stock actions are tracked through workflow execution logs.

The current demo is built around **Urban Glow Salon** and runs without authentication, paid APIs, or external setup.

---

## Why I built this

Many small businesses still manage stock manually through notebooks, WhatsApp messages, spreadsheets, or memory. Creating a proper inventory system or online storefront usually requires time, technical knowledge, and repeated manual data entry.

ScanMart AI explores a faster workflow:

> Scan the product → review structured data → add it to inventory → publish it → automate the next steps.

The goal is not to build a large marketplace. The goal is to show how AI can reduce repetitive work inside a real business process.

---

## Core features

### Product scanning

Sellers can upload a product image or enter label text. The app returns structured product data such as:

* Product name
* Brand
* Category
* Description
* Quantity
* Unit
* Confidence score
* Detected text

### Human-in-the-loop review

AI output is never saved blindly. The seller can review and edit every extracted field before confirming the product.

Confidence levels guide the review flow:

* High confidence: ready to confirm
* Medium confidence: review suggested
* Low confidence: manual correction required

Corrections are stored as feedback so the system can track what changed between AI output and the final seller-approved record.

### Inventory management

Confirmed products are added to inventory with category, quantity, price, source, and stock status.

The inventory dashboard supports:

* Category filtering
* Search
* Low-stock indicators
* Product status
* Manual and AI-assisted item creation

### Storefront publishing

Inventory items can be published as storefront listings. This separates internal stock management from customer-facing products.

A seller can keep an item in inventory only, or publish it to the public store when it is ready.

### Order management

Customers can browse the demo storefront, add products to cart, and place an order request.

The seller can then accept or manage orders from the dashboard.

No payment system is implemented in the MVP. The current flow is designed for pickup, cash-on-delivery, or manual confirmation.

### Workflow automation traces

ScanMart AI includes a simple workflow execution system inspired by automation tools, but focused only on inventory and commerce operations.

Example workflow actions include:

* Scan confirmation
* Draft listing creation
* Product publishing
* Order acceptance
* Stock reduction
* Low-stock checks
* Seller task creation
* In-app notifications

Each workflow run records step-by-step execution logs, including status, input, output, and timing.

Order acceptance is designed to be idempotent, preventing duplicate stock reduction if the same order action is triggered more than once.

---

## Demo flow

The included demo uses **Urban Glow Salon**.

Recommended demo path:

1. Open the landing page.
2. Enter the demo dashboard.
3. Go to the scan page.
4. Upload a product image or enter label text such as:

```txt
Dove shampoo 500ml
```

5. Review the structured product result.
6. Edit any field if needed.
7. Confirm the product into inventory.
8. Publish it as a storefront listing.
9. Open the public storefront.
10. Place a customer order.
11. Accept the order from the seller dashboard.
12. View workflow execution logs.

---

## Example scan output

```json
{
  "productName": "Dove Shampoo",
  "brand": "Dove",
  "category": "Haircare",
  "description": "Daily care shampoo for salon inventory.",
  "suggestedUnit": "bottle",
  "suggestedQuantity": 1,
  "confidence": 0.87,
  "detectedText": ["Dove", "Shampoo", "500ml"]
}
```

---

## Tech stack

* Next.js
* TypeScript
* Tailwind CSS
* Zod
* Supabase-ready schema
* LocalStorage demo mode
* Mock AI extraction layer
* Workflow execution logging

The MVP currently uses a local/demo-first setup so the product can be tested without paid services or authentication setup.

---

## AI architecture

ScanMart AI uses an AI provider abstraction so the app can run in two modes:

### Mock AI mode

Used for the current demo. It returns deterministic structured outputs based on product image names or label text.

This keeps the demo free, fast, and reliable.

### Real AI provider mode

The codebase is structured so a real vision-language model can be connected later through the same interface.

Potential providers:

* Gemini Vision
* OpenAI vision models
* Other multimodal LLM APIs

---

## Workflow engine

The workflow engine is intentionally small and domain-specific.

It is not trying to recreate n8n. Instead, it focuses on the workflows needed inside this product.

Supported workflow concepts:

* Trigger
* Node execution
* Status tracking
* Input/output logging
* Failure handling
* Human approval state
* Idempotent order actions

Example workflow:

```txt
Order accepted
→ reduce stock
→ check low stock
→ create seller notification
→ save execution trace
```

This makes the product more than a CRUD dashboard. It shows how AI-generated business data can move through operational workflows.

---

## Project structure

```txt
app/
  dashboard/
  inventory/
  scan/
  orders/
  automations/
  store/

components/
  dashboard/
  inventory/
  scan/
  orders/
  automations/
  ui/

lib/
  ai/
  workflow/
  templates/
  validation/
  storage/

types/
  index.ts
```

---

## Why this is AI-native

ScanMart AI uses AI inside the actual product flow:

* Product images and label text become structured inventory data.
* Confidence scores influence review behavior.
* Sellers can correct extracted fields before saving.
* Corrections are stored as feedback.
* Confirmed scans trigger operational workflows.
* Workflow steps record input, output, status, and timing.

The AI is not a side assistant. It is part of how products are created, validated, published, and processed.

---

## Current status

This is an active MVP build.

Completed or in progress:

* Product scan flow
* Structured extraction interface
* Human review and correction flow
* Inventory dashboard
* Storefront publishing flow
* Customer order flow
* Workflow execution logs
* Demo business mode

Planned improvements:

* Real AI vision provider integration
* Supabase authentication
* Supabase storage for product images
* Visual workflow builder
* Receipt scanning
* Barcode scanning
* Supplier/reorder suggestions
* Product analytics dashboard

---

## Resume summary

**ScanMart AI · Next.js · TypeScript · Tailwind · Zod · Supabase schema · LocalStorage demo**

Built an AI-native inventory and storefront MVP where sellers scan product images or label text, review structured outputs, confirm inventory records, publish listings, and process customer orders.

Designed human-in-the-loop validation where extracted fields remain editable, confidence controls review prompts, and seller corrections are stored as feedback for future improvement.

Implemented workflow automation traces for scan confirmation, draft listing creation, order acceptance, stock reduction, low-stock checks, seller tasks, and notifications, with idempotent order acceptance to prevent duplicate stock reduction.

---
