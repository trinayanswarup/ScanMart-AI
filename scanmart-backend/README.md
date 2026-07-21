# ScanMart AI — FastAPI Backend

Real Postgres backend that replaces the localStorage layer.
Connects to Supabase. Exposes a REST API the Next.js frontend will consume.

## Prerequisites

- Python 3.11+
- A Supabase project with the schema applied (see below)

---

## 1. Apply the database schema

In the Supabase SQL editor (or `psql`), run these two files **in order**:

```sql
-- 1. Base schema
\i supabase/schema.sql

-- 2. Additions required by this backend
\i supabase/schema_additions.sql
```

`schema_additions.sql` adds:
- `company` table
- `trigger` column on `workflow_executions`
- `node_name` column on `workflow_node_executions`
- `name` (snapshot) column on `order_items`
- Relaxes the `product_listings.price` constraint to `>= 0` (drafts start at 0)

---

## 2. Configure the environment

```bash
cd scanmart-backend
cp .env.example .env
# Edit .env and fill in your DATABASE_URL
```

Use the **direct connection** string from Supabase → Project Settings → Database →
Connection string (port 5432, not the 6543 pooler). The direct connection runs as
the `postgres` superuser, which bypasses row-level security — correct for a trusted
backend service that handles its own auth.

---

## 3. Install dependencies

```bash
cd scanmart-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## 4. Seed the database

Run once after applying the schema:

```bash
python seed.py
```

This inserts the same 3-store demo data as `lib/seed.ts` (Urban Glow Salon,
Corner Café, FreshMart Grocery) using real UUIDs. The script prints all
generated IDs — **save them** for the Next.js migration step.

The seed is idempotent: re-running is safe (uses `ON CONFLICT DO NOTHING`).

---

## 5. Run locally

```bash
uvicorn main:app --reload
```

API is now at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## 6. Test with curl

```bash
# Company
curl http://localhost:8000/company

# All stores
curl http://localhost:8000/stores

# Inventory for a store (replace with a UUID from seed output)
curl http://localhost:8000/stores/<salon_id>/inventory

# Add an inventory item (ai_scan — creates draft listing + workflow execution)
curl -X POST http://localhost:8000/stores/<salon_id>/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Shampoo",
    "category": "Haircare",
    "description": "A test product.",
    "quantity": 10,
    "unit": "pcs",
    "price": 299,
    "source": "ai_scan"
  }'

# Place an order (cart with one item)
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [{
      "storeId": "<cafe_id>",
      "listingId": "<list_coffee_uuid>",
      "inventoryItemId": "<coffee_inv_uuid>",
      "productName": "Ethiopian Arabica Coffee Beans",
      "price": 1200,
      "quantity": 1
    }],
    "customerName": "Test User",
    "customerPhone": "+1 555 0000"
  }'

# Accept an order (reduces stock atomically)
curl -X PATCH http://localhost:8000/orders/<order_id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted"}'

# Approve a waiting execution
curl -X PATCH http://localhost:8000/executions/<execution_id>/approve
```

---

## 7. Deploy to Render

1. Push the repo to GitHub (Render needs a git remote).
2. In Render, create a new **Web Service**:
   - **Root directory**: `scanmart-backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add `DATABASE_URL` as an environment variable (Render dashboard → Environment).
4. Update the `allow_origins` list in `main.py` with your Vercel production URL.

The backend service imports from `../eval/` if the preprocessing microservice is
co-located; the two services are independent so this is not required here.

---

## Architecture notes

### Business logic parity with the TypeScript frontend

| TypeScript function | API endpoint | Notes |
|---|---|---|
| `addInventory()` | `POST /stores/{id}/inventory` | Draft listing + workflow execution for `ai_scan` |
| `updateInventory()` | `PATCH /inventory/{id}` | Dynamic SET clause, no empty-patch 400 by design |
| `saveListing()` | `PATCH /listings/{id}` | Caller sets `isPublished: true` to publish |
| `placeOrder()` | `POST /orders` | Atomic validation phase before any INSERT |
| `updateOrderStatus()` | `PATCH /orders/{id}/status` | `FOR UPDATE` lock prevents TOCTOU race on accept |
| `approveWorkflowExecution()` | `PATCH /executions/{id}/approve` | Same exact price-check message as TS |

### Idempotency
- `stockReduced` maps to `stock_reduced_at IS NOT NULL` in the DB. Re-sending
  `PATCH /orders/{id}/status` with `"accepted"` after stock was already reduced
  takes the plain-update path (no second stock deduction).

### Row-level security
The backend connects as the `postgres` superuser via `DATABASE_URL`, which
bypasses Supabase's RLS policies. This is intentional — the FastAPI layer is
the trust boundary. Do not use the anon or service-role Supabase client keys
here; use the direct Postgres connection string.

### JSON in asyncpg
`database.py` registers a `jsonb` codec so Python `dict`/`list` values are
automatically serialised on write and deserialised on read. Never call
`json.dumps()` before passing a value to a `jsonb` column — the codec handles it.
