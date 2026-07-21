# ScanMart AI

AI-powered inventory management for multi-store retail groups - scan a label, get a live product listing in seconds.

## Screenshots

![Landing Page](./docs/screenshots/landing.png)
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)
![AI Scan Flow](./docs/screenshots/scan-flow.png)
![Public Storefront](./docs/screenshots/storefront.png)
![Adding from multiple stores](./docs/screenshots/cart-step1-add.png)
_Browsing Corner Café, adding coffee beans — items from any store go into one shared cart._

![Cart grouped by store](./docs/screenshots/cart-step2-grouped.png)
_The cart automatically groups items by store._ three products, three stores, one checkout.\_

![Cart grouped by store](./docs/screenshots/cart-step3-grouped.png)
_three products, three stores, one checkout._

![Checkout splits per store](./docs/screenshots/cart-step4-split.png)
_Confirming the order creates a separate order per store — each seller only ever sees their own._

![Order Confirmation](./docs/screenshots/order-confirmation.png)

## What it does

Small business owners waste hours manually entering product data. ScanMart AI eliminates that:

1. **Scan** - photo, camera, barcode, manual text, or a receipt/invoice for bulk import
2. **Extract** - NVIDIA NIM vision model reads the label and returns structured data with a confidence score
3. **Review** - the seller sees exactly what the AI extracted and edits any field
4. **Approve** - one click publishes to a public storefront
5. **Track** - every step is logged in a workflow execution trace

ScanMart Retail Group operates three store formats - Urban Glow Salon, Corner Café, and FreshMart Grocery - each with independent inventory, orders, and workflows, sharing one admin platform and one customer storefront.

## Tech stack

| Layer         | Choice                                                                        |
| ------------- | ----------------------------------------------------------------------------- |
| Frontend      | Next.js 15 (App Router), React 19, TypeScript strict                          |
| AI extraction | NVIDIA NIM - `meta/llama-3.2-11b-vision-instruct`                             |
| OCR / Barcode | Tesseract.js (3-angle scan), `@zxing/browser` + Open Food Facts               |
| Styling       | Tailwind CSS 4, CSS custom properties, dark mode                              |
| Validation    | Zod                                                                           |
| Backend       | FastAPI + asyncpg (Python)                                                    |
| Database      | Supabase Postgres - shared inventory, orders, workflows                       |
| Cart          | localStorage - private per customer, never sent to the backend until checkout |
| Tests         | Vitest, 70 tests                                                              |
| Eval tooling  | Python - pandas, rapidfuzz, Pillow                                            |

## Key features

- Four scan modes: photo/camera, barcode, manual text, receipt/invoice bulk import
- Multimodal AI extraction with confidence scoring and human review before anything publishes
- Product photos captured from scans, shown on storefront listings
- Atomic, idempotent order acceptance - stock validates and reduces exactly once
- Full workflow audit trail, server-side
- Multi-store cart with per-store checkout splitting
- Dark mode

## Architecture

```
Scan → OCR / barcode detection → NVIDIA NIM extraction → seller review
  → POST to backend → Postgres (Supabase)
  → draft listing + workflow execution → seller approval → live storefront
  → customer order → atomic stock check → order accepted → stock reduced once
```

Cart state lives in the browser (localStorage) and stays private until checkout. Everything else - inventory, listings, orders, workflows - is shared, real data served by a FastAPI backend backed by Postgres.

## Getting started

**Frontend**

```bash
git clone https://github.com/trinayanswarup/ScanMart-AI
cd ScanMart-AI
npm install
cp .env.example .env.local
npm run dev
```

**Backend**

```bash
cd scanmart-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python seed.py
uvicorn main:app --reload
```

Full backend setup and Render deploy notes: `scanmart-backend/README.md`.

Demo access: `admin@scanmart.eu` / `admin123`, or use the "Enter Demo Workspace" button on the login page for credential-free access.

## Python evaluation harness

`eval/` measures real extraction accuracy against a hand-labeled 22-image dataset of real product photos.

```bash
cd eval
pip install -r requirements.txt
python run_eval.py               # baseline
python run_eval.py --preprocess  # with image preprocessing
python report.py                 # accuracy by failure category
```

**Results (22-image dataset, raw images):**

| Metric                            | Score |
| --------------------------------- | ----- |
| Overall (name + category correct) | 41%   |
| Name accuracy                     | 68%   |
| Category accuracy                 | 55%   |

Preprocessing (EXIF orientation, contrast, sharpening) improved category accuracy on clean images by 12 points but had no effect on blur, small text, or store-branded packaging - those are model/prompt-level failures, not image-quality ones. The preprocessing pipeline also exists as a standalone FastAPI microservice (`scanmart-preprocess/`), built and tested but not yet wired into production.

## Environment variables

```env
# .env.local
NVIDIA_API_KEY=
NEXT_PUBLIC_API_URL=          # FastAPI backend URL

# scanmart-backend/.env
DATABASE_URL=                 # Supabase Postgres connection string
```

## Roadmap

- **Done** - AI scan (4 modes), inventory, listings, storefront, cart/checkout, workflow traces, FastAPI + Postgres backend, atomic order processing, test suite, eval harness
- **In progress** - real authentication and business ownership, product image storage, background workflow runner
- **Planned** - Electronics and Fashion store verticals, correction-based accuracy improvements, operational analytics, multi-staff roles, payments

## Development process

Built with Claude Code as the primary development agent. See [AGENTS-REPO.md](./AGENTS-REPO.md), [CLAUDE-REPO.md](./CLAUDE-REPO.md), and [PRD-REPO.md](./PRD-REPO.md) for the operating rules, project context, and requirements used throughout development.

---

Built by [Trinayan Swarup](https://github.com/trinayanswarup)
