# ScanMart AI

> AI-powered inventory management for small businesses — scan a label, get a live product listing in seconds.

---

## What it does

Small business owners (salons, cafés, grocery stores) waste hours manually entering product data. ScanMart AI eliminates that:

1. **Scan** — Upload a photo or scan a barcode
2. **Extract** — Gemini 2.0 Flash vision reads the label and returns structured product data with a confidence score
3. **Review** — Seller sees exactly what the AI extracted and can edit anything
4. **Approve** — One click publishes to a public storefront
5. **Track** — Every step is logged in a workflow execution trace

The core thesis: **AI is part of the product workflow, not a chatbox stapled on the side.**

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5.7 strict |
| AI extraction | Gemini 2.0 Flash (vision + text) via `@google/genai` |
| OCR | Tesseract.js 7 (browser, 3-angle scan) |
| Barcode | `@zxing/browser` + Open Food Facts API |
| Styling | Tailwind CSS 4, Lucide React |
| Validation | Zod 3 |
| Storage | localStorage (demo) · Supabase schema included |

---

## Key features

- **Multimodal AI** — Sends both the raw image and OCR text to Gemini for maximum accuracy
- **3-angle OCR** — Tesseract runs at 0°, 90°, 270° and picks the best result
- **Barcode lookup** — ZXing decodes barcodes from images; Open Food Facts fills product data
- **Confidence scoring** — Every extraction gets a 0–1 score with human-readable label
- **Atomic order processing** — Stock validates ALL items before any mutation; reduces exactly once
- **Workflow audit trail** — Every automation step logged with input, output, status, timestamp
- **Human-in-the-loop** — Nothing publishes without seller approval
- **3 demo businesses** — Salon, café, and grocery with full seed data

---

## Demo businesses

| Business | Type | Products |
|---|---|---|
| Urban Glow Salon | Salon | Shampoo, wax, razors, serums |
| Corner Café | Café | Coffee beans, oat milk, croissants |
| FreshMart Grocery | Grocery | Biscuits, butter, salt, snacks |

Switch between them in Settings → Switch demo business.

---

## Getting started

```bash
git clone https://github.com/trinayanswarup/ScanMart-AI
cd ScanMart-AI
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without a `GEMINI_API_KEY` the app falls back to the deterministic mock extractor automatically — no errors.

---

## Architecture

```
User scans product
  ↓
Tesseract.js (3-angle OCR in browser)
  ↓
ZXing (barcode detection from image)
  ↓ (if barcode found)
Open Food Facts API → ProductAIExtraction
  ↓ (if no barcode)
POST /api/extract → Gemini 2.0 Flash (image + OCR text) → ProductAIExtraction
  ↓ (if no API key / API fails)
mockExtractProduct() → deterministic local fallback
  ↓
Seller reviews confidence score and edits fields
  ↓
addInventory() → AppState update → localStorage
  ↓
Workflow execution: PRODUCT_SCANNED → draft listing → human approval
  ↓
Seller approves → listing published → public storefront live
  ↓
Customer orders → atomic stock validation → ORDER_ACCEPTED workflow
```

---

## Environment variables

```env
GEMINI_API_KEY=         # Required for real AI extraction (falls back to mock if absent)

# Supabase — schema included at supabase/schema.sql, not yet wired to the client
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Production roadmap

- **Phase 1 (done):** Full demo MVP — localStorage, mock AI fallback, complete UI
- **Phase 2:** Supabase auth + DB client, real image storage
- **Phase 3:** Correction dataset feedback loop, background workflow runner
- **Phase 4:** Multi-staff roles, payments, supplier workflows

---

Built by [Trinayan Swarup](https://github.com/trinayanswarup)
