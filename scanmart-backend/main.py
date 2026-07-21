"""
ScanMart AI — FastAPI backend
Replicates the business logic in components/app-provider.tsx against a real Postgres database.
"""
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import close_pool, get_pool
from models import (
    CartItem,
    InventoryPatch,
    ListingPatch,
    NewInventoryRequest,
    OrderStatusRequest,
    PlaceOrderRequest,
)


# ── App setup ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(title="ScanMart AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_origins=["https://scan-mart-ai.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Row → dict helpers ────────────────────────────────────────────────────────

def _s(v: Any) -> str | None:
    return str(v) if v is not None else None


def _iso(dt: Any) -> str:
    if dt is None:
        return datetime.now(timezone.utc).isoformat()
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


def _row_to_business(r: asyncpg.Record) -> dict:
    return {
        "id": str(r["id"]),
        "name": r["name"],
        "slug": r["slug"],
        "businessType": r["business_type"],
        "lowStockThreshold": float(r["default_low_stock_threshold"]),
    }


def _row_to_item(r: asyncpg.Record) -> dict:
    return {
        "id": str(r["id"]),
        "businessId": str(r["business_id"]),
        "name": r["name"],
        "brand": r["brand"],
        "category": r["category"],
        "description": r["description"] or "",
        "quantity": float(r["quantity"]),
        "unit": r["unit"],
        "lowStockThreshold": float(r["low_stock_threshold"]),
        "price": float(r["price"]) if r["price"] is not None else None,
        "imageUrl": r["image_url"],
        "source": r["source"],
        "aiConfidence": float(r["ai_confidence"]) if r["ai_confidence"] is not None else None,
        "status": r["status"],
        "createdAt": _iso(r["created_at"]),
    }


def _row_to_listing(r: asyncpg.Record) -> dict:
    return {
        "id": str(r["id"]),
        "businessId": str(r["business_id"]),
        "inventoryItemId": str(r["inventory_item_id"]),
        "title": r["title"],
        "description": r["description"],
        "price": float(r["price"]),
        "imageUrl": r["image_url"],
        "isPublished": r["is_published"],
    }


def _row_to_order_item(r: asyncpg.Record) -> dict:
    return {
        "id": str(r["id"]),
        "listingId": str(r["product_listing_id"]),
        "inventoryItemId": str(r["inventory_item_id"]),
        "name": r["name"],
        "quantity": float(r["quantity"]),
        "unitPrice": float(r["unit_price"]),
        "lineTotal": float(r["line_total"]),
    }


def _row_to_order(order: asyncpg.Record, items: list[asyncpg.Record]) -> dict:
    return {
        "id": str(order["id"]),
        "businessId": str(order["business_id"]),
        "customerName": order["customer_name"],
        "customerPhone": order["customer_phone"],
        "customerEmail": order["customer_email"],
        "status": order["status"],
        "totalAmount": float(order["total_amount"]),
        "items": [_row_to_order_item(i) for i in items],
        "createdAt": _iso(order["created_at"]),
        # stock_reduced_at IS NOT NULL  ↔  stockReduced: true
        "stockReduced": order["stock_reduced_at"] is not None,
    }


def _row_to_node(r: asyncpg.Record) -> dict:
    return {
        "id": str(r["id"]),
        "nodeName": r["node_name"],
        "nodeType": r["node_type"],
        "status": r["status"],
        "input": r["input_json"] or {},
        "output": r["output_json"],
        "error": r["error_message"],
        "timestamp": _iso(r["started_at"]),
    }


def _row_to_execution(exec_r: asyncpg.Record, nodes: list[asyncpg.Record]) -> dict:
    return {
        "id": str(exec_r["id"]),
        "workflowId": str(exec_r["workflow_id"]),
        "status": exec_r["status"],
        "trigger": exec_r["trigger"],
        "startedAt": _iso(exec_r["started_at"]),
        "nodes": [_row_to_node(n) for n in nodes],
    }


def _row_to_workflow(r: asyncpg.Record) -> dict:
    defn: dict = r["definition"] or {}
    return {
        "id": str(r["id"]),
        "businessId": str(r["business_id"]),
        "name": r["name"],
        "triggerType": r["trigger_type"],
        "description": defn.get("description", ""),
        "isActive": r["is_active"],
        "nodeNames": defn.get("nodeNames", []),
    }


async def _fetch_order(conn: asyncpg.Connection, order_id: str) -> dict:
    order_row = await conn.fetchrow(
        """SELECT id, business_id, customer_name, customer_phone, customer_email,
                  status, total_amount, stock_reduced_at, created_at
           FROM orders WHERE id = $1::uuid""",
        order_id,
    )
    if not order_row:
        raise HTTPException(status_code=404, detail="Order not found")
    item_rows = await conn.fetch(
        """SELECT id, product_listing_id, inventory_item_id, name,
                  quantity, unit_price, line_total
           FROM order_items WHERE order_id = $1::uuid ORDER BY id""",
        order_id,
    )
    return _row_to_order(order_row, item_rows)


# ── Workflow execution helpers ────────────────────────────────────────────────

async def _insert_node(
    conn: asyncpg.Connection,
    exec_id: str,
    node_name: str,
    node_type: str,
    status: str,
    input_data: dict,
    output_data: dict | None,
    ts: datetime,
) -> None:
    await conn.execute(
        """INSERT INTO workflow_node_executions
           (execution_id, node_id, node_name, node_type, status,
            input_json, output_json, started_at, finished_at)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)""",
        exec_id,
        str(uuid.uuid4()),
        node_name,
        node_type,
        status,
        input_data,
        output_data,
        ts,
        ts if status != "waiting_for_human" else None,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/company")
async def get_company():
    pool = await get_pool()
    row = await pool.fetchrow("SELECT id, name FROM company LIMIT 1")
    if not row:
        raise HTTPException(status_code=404, detail="Company not configured")
    return {"id": row["id"], "name": row["name"]}


@app.get("/stores")
async def get_stores():
    pool = await get_pool()
    rows = await pool.fetch(
        "SELECT id, name, slug, business_type, default_low_stock_threshold "
        "FROM businesses ORDER BY name",
    )
    return [_row_to_business(r) for r in rows]


# ── Inventory ─────────────────────────────────────────────────────────────────

@app.get("/stores/{store_id}/inventory")
async def get_inventory(store_id: str):
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT id, business_id, name, brand, category, description, quantity, unit,
                  low_stock_threshold, price, image_url, source, ai_confidence, status, created_at
           FROM inventory_items
           WHERE business_id = $1::uuid
           ORDER BY created_at DESC""",
        store_id,
    )
    return [_row_to_item(r) for r in rows]


@app.post("/stores/{store_id}/inventory", status_code=201)
async def add_inventory(store_id: str, body: NewInventoryRequest):
    """
    Mirror of addInventory() in app-provider.tsx:
    - Inserts inventory item
    - For ai_scan: creates a draft listing (price = 0 if not provided) and a
      PRODUCT_SCANNED workflow execution with 3 nodes
    - Logs AI correction if original != corrected
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            item_id: uuid.UUID = await conn.fetchval(
                """INSERT INTO inventory_items
                   (business_id, name, brand, category, description, quantity, unit,
                    low_stock_threshold, price, image_url, source, ai_confidence, status)
                   VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                   RETURNING id""",
                store_id, body.name, body.brand, body.category, body.description,
                body.quantity, body.unit, body.lowStockThreshold, body.price,
                body.imageUrl, body.source, body.aiConfidence, body.status,
            )
            item_id_str = str(item_id)

            if body.source == "ai_scan":
                # Draft price: use provided price if positive, else 0 (allowed by updated constraint)
                draft_price = body.price if (body.price is not None and body.price > 0) else 0

                listing_id: uuid.UUID = await conn.fetchval(
                    """INSERT INTO product_listings
                       (business_id, inventory_item_id, title, description,
                        price, image_url, is_published)
                       VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6,false)
                       RETURNING id""",
                    store_id, item_id_str, body.name, body.description,
                    draft_price, body.imageUrl,
                )
                listing_id_str = str(listing_id)

                workflow_row = await conn.fetchrow(
                    """SELECT id FROM workflows
                       WHERE business_id = $1::uuid
                         AND trigger_type = 'PRODUCT_SCANNED'
                         AND is_active = true
                       LIMIT 1""",
                    store_id,
                )
                if workflow_row:
                    now = datetime.now(timezone.utc)
                    exec_id: uuid.UUID = await conn.fetchval(
                        """INSERT INTO workflow_executions
                           (workflow_id, business_id, status, trigger, input_json)
                           VALUES ($1::uuid,$2::uuid,'waiting_for_human','PRODUCT_SCANNED',$3)
                           RETURNING id""",
                        str(workflow_row["id"]), store_id,
                        {"inventoryItemId": item_id_str},
                    )
                    exec_id_str = str(exec_id)

                    await _insert_node(conn, exec_id_str,
                        "AI generated product description", "GENERATE_PRODUCT_DESCRIPTION",
                        "success",
                        {"inventoryItemId": item_id_str},
                        {"description": body.description},
                        now)
                    await _insert_node(conn, exec_id_str,
                        "Draft listing created", "CREATE_DRAFT_LISTING",
                        "success",
                        {"inventoryItemId": item_id_str},
                        {"listingId": listing_id_str},
                        now)
                    await _insert_node(conn, exec_id_str,
                        "Waiting for seller approval", "REQUEST_HUMAN_APPROVAL",
                        "waiting_for_human",
                        {"listingId": listing_id_str},
                        None,
                        now)

            # Log correction when seller edited AI output before saving
            if (body.original and body.corrected
                    and body.original != body.corrected):
                await conn.execute(
                    """INSERT INTO ai_correction_logs
                       (business_id, inventory_item_id, original_ai_output, corrected_output)
                       VALUES ($1::uuid,$2::uuid,$3,$4)""",
                    store_id, item_id_str, body.original, body.corrected,
                )

            row = await conn.fetchrow(
                """SELECT id, business_id, name, brand, category, description, quantity, unit,
                          low_stock_threshold, price, image_url, source, ai_confidence, status, created_at
                   FROM inventory_items WHERE id = $1""",
                item_id,
            )
            return _row_to_item(row)


@app.patch("/inventory/{item_id}")
async def update_inventory(item_id: str, body: InventoryPatch):
    col_map = {
        "name": body.name, "brand": body.brand, "category": body.category,
        "description": body.description, "quantity": body.quantity,
        "unit": body.unit, "low_stock_threshold": body.lowStockThreshold,
        "price": body.price, "image_url": body.imageUrl, "status": body.status,
    }
    updates = {k: v for k, v in col_map.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(updates))
    row = await (await get_pool()).fetchrow(
        f"""UPDATE inventory_items SET {set_clause}
            WHERE id = $1::uuid
            RETURNING id, business_id, name, brand, category, description, quantity, unit,
                      low_stock_threshold, price, image_url, source, ai_confidence, status, created_at""",
        item_id, *updates.values(),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return _row_to_item(row)


# ── Listings ──────────────────────────────────────────────────────────────────

@app.get("/stores/{store_id}/listings")
async def get_listings(store_id: str):
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT pl.id, pl.business_id, pl.inventory_item_id, pl.title, pl.description,
                  pl.price, pl.image_url, pl.is_published
           FROM product_listings pl
           JOIN inventory_items ii ON ii.id = pl.inventory_item_id
           WHERE pl.business_id = $1::uuid
             AND ii.status = 'active'
           ORDER BY pl.created_at DESC""",
        store_id,
    )
    return [_row_to_listing(r) for r in rows]


@app.patch("/listings/{listing_id}")
async def update_listing(listing_id: str, body: ListingPatch):
    col_map = {
        "title": body.title, "description": body.description,
        "price": body.price, "is_published": body.isPublished,
    }
    updates = {k: v for k, v in col_map.items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(updates))
    row = await (await get_pool()).fetchrow(
        f"""UPDATE product_listings SET {set_clause}
            WHERE id = $1::uuid
            RETURNING id, business_id, inventory_item_id, title, description,
                      price, image_url, is_published""",
        listing_id, *updates.values(),
    )
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _row_to_listing(row)


# ── Orders ────────────────────────────────────────────────────────────────────

@app.get("/stores/{store_id}/orders")
async def get_orders(store_id: str):
    pool = await get_pool()
    order_rows = await pool.fetch(
        """SELECT id, business_id, customer_name, customer_phone, customer_email,
                  status, total_amount, stock_reduced_at, created_at
           FROM orders WHERE business_id = $1::uuid
           ORDER BY created_at DESC""",
        store_id,
    )
    result = []
    for order_row in order_rows:
        item_rows = await pool.fetch(
            """SELECT id, product_listing_id, inventory_item_id, name,
                      quantity, unit_price, line_total
               FROM order_items WHERE order_id = $1::uuid ORDER BY id""",
            order_row["id"],
        )
        result.append(_row_to_order(order_row, item_rows))
    return result


@app.post("/orders", status_code=201)
async def place_order(body: PlaceOrderRequest):
    """
    Mirror of placeOrder() in app-provider.tsx:
    - Groups cart by storeId
    - Validates ALL inventory quantities atomically (SELECT FOR UPDATE) before
      creating any order — no partial mutations
    - Creates one order per store
    Returns {"orderIds": [...]}
    """
    if not body.cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    if not body.customerPhone and not body.customerEmail:
        raise HTTPException(
            status_code=422,
            detail="Provide at least a phone number or email address.",
        )

    # Group by storeId — preserves the TypeScript split-checkout-by-store behaviour
    by_store: dict[str, list[CartItem]] = {}
    for item in body.cart:
        by_store.setdefault(item.storeId, []).append(item)

    pool = await get_pool()
    order_ids: list[str] = []

    async with pool.acquire() as conn:
        async with conn.transaction():
            # ── Phase 1: atomic validation — lock every inventory row first ──
            for store_id, items in by_store.items():
                inv_ids = [i.inventoryItemId for i in items]
                inv_rows = await conn.fetch(
                    """SELECT id, quantity FROM inventory_items
                       WHERE id = ANY($1::uuid[]) AND business_id = $2::uuid
                       FOR UPDATE""",
                    inv_ids, store_id,
                )
                inv_map = {str(r["id"]): float(r["quantity"]) for r in inv_rows}

                for cart_item in items:
                    available = inv_map.get(cart_item.inventoryItemId)
                    if available is None or available < cart_item.quantity:
                        raise HTTPException(
                            status_code=422,
                            detail=f"Insufficient stock for {cart_item.productName}",
                        )

            # ── Phase 2: create orders (all validation passed) ──
            for store_id, items in by_store.items():
                total = sum(i.price * i.quantity for i in items)
                order_id_val: uuid.UUID = await conn.fetchval(
                    """INSERT INTO orders
                       (business_id, customer_name, customer_phone, customer_email,
                        status, total_amount)
                       VALUES ($1::uuid,$2,$3,$4,'new',$5)
                       RETURNING id""",
                    store_id, body.customerName, body.customerPhone,
                    body.customerEmail, total,
                )
                order_id_str = str(order_id_val)
                order_ids.append(order_id_str)

                for cart_item in items:
                    await conn.execute(
                        """INSERT INTO order_items
                           (order_id, product_listing_id, inventory_item_id, name,
                            quantity, unit_price, line_total)
                           VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7)""",
                        order_id_str,
                        cart_item.listingId,
                        cart_item.inventoryItemId,
                        cart_item.productName,  # creation-time snapshot, never mutated
                        cart_item.quantity,
                        cart_item.price,
                        cart_item.price * cart_item.quantity,
                    )

    return {"orderIds": order_ids}


@app.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusRequest):
    """
    Mirror of updateOrderStatus() in app-provider.tsx.

    Accepting an order is the critical path:
      1. SELECT FOR UPDATE all required inventory rows (prevents TOCTOU races)
      2. Validate every line item has sufficient stock — ALL must pass, none partial
      3. Reduce stock exactly once (idempotency: stock_reduced_at NOT NULL guard)
      4. Create ORDER_ACCEPTED workflow execution with stock/low-stock audit nodes
    All other status transitions are a plain UPDATE.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        order_row = await conn.fetchrow(
            """SELECT id, business_id, status, stock_reduced_at
               FROM orders WHERE id = $1::uuid""",
            order_id,
        )
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")

        already_reduced = order_row["stock_reduced_at"] is not None

        if body.status == "accepted" and not already_reduced:
            item_rows = await conn.fetch(
                """SELECT inventory_item_id, quantity, name
                   FROM order_items WHERE order_id = $1::uuid""",
                order_id,
            )

            async with conn.transaction():
                inv_ids = [str(r["inventory_item_id"]) for r in item_rows]
                inv_rows = await conn.fetch(
                    """SELECT id, quantity, low_stock_threshold
                       FROM inventory_items
                       WHERE id = ANY($1::uuid[])
                       FOR UPDATE""",
                    inv_ids,
                )
                inv_map = {str(r["id"]): r for r in inv_rows}

                # Validate all before touching anything
                for item in item_rows:
                    inv_id = str(item["inventory_item_id"])
                    inv = inv_map.get(inv_id)
                    if inv is None or float(inv["quantity"]) < float(item["quantity"]):
                        raise HTTPException(
                            status_code=422,
                            detail=f"{item['name']} does not have enough stock.",
                        )

                # Reduce stock — exactly once, guarded by the transaction
                for item in item_rows:
                    await conn.execute(
                        """UPDATE inventory_items
                           SET quantity = quantity - $2
                           WHERE id = $1::uuid""",
                        str(item["inventory_item_id"]),
                        float(item["quantity"]),
                    )

                now = datetime.now(timezone.utc)
                await conn.execute(
                    """UPDATE orders
                       SET status = 'accepted', stock_reduced_at = $2
                       WHERE id = $1::uuid""",
                    order_id, now,
                )

                # Identify low-stock items after reduction
                updated_inv = await conn.fetch(
                    """SELECT name, quantity, low_stock_threshold
                       FROM inventory_items WHERE id = ANY($1::uuid[])""",
                    inv_ids,
                )
                low_stock = [
                    r["name"] for r in updated_inv
                    if float(r["quantity"]) <= float(r["low_stock_threshold"])
                ]

                # ORDER_ACCEPTED workflow execution (mirrors updateOrderStatus logic)
                workflow_row = await conn.fetchrow(
                    """SELECT id FROM workflows
                       WHERE business_id = $1::uuid
                         AND trigger_type = 'ORDER_ACCEPTED'
                         AND is_active = true
                       LIMIT 1""",
                    str(order_row["business_id"]),
                )
                if workflow_row:
                    exec_id: uuid.UUID = await conn.fetchval(
                        """INSERT INTO workflow_executions
                           (workflow_id, business_id, status, trigger, input_json, finished_at)
                           VALUES ($1::uuid,$2::uuid,'success','ORDER_ACCEPTED',$3,$4)
                           RETURNING id""",
                        str(workflow_row["id"]),
                        str(order_row["business_id"]),
                        {"orderId": order_id},
                        now,
                    )
                    eid = str(exec_id)
                    await _insert_node(conn, eid, "Stock reduced", "REDUCE_STOCK",
                        "success", {"orderId": order_id},
                        {"itemsUpdated": len(item_rows)}, now)
                    await _insert_node(conn, eid, "Low stock checked", "CHECK_LOW_STOCK",
                        "success", {"orderId": order_id},
                        {"lowStockItems": low_stock}, now)
                    msg = (f"{len(low_stock)} item(s) need attention"
                           if low_stock else "Stock levels look healthy")
                    await _insert_node(conn, eid, "Seller notified", "SEND_IN_APP_NOTIFICATION",
                        "success", {"orderId": order_id}, {"message": msg}, now)

        else:
            # Plain status change — no stock mutation
            async with conn.transaction():
                await conn.execute(
                    "UPDATE orders SET status = $2 WHERE id = $1::uuid",
                    order_id, body.status,
                )

        return await _fetch_order(conn, order_id)


# ── Workflows & executions ────────────────────────────────────────────────────

@app.get("/stores/{store_id}/workflows")
async def get_workflows(store_id: str):
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT id, business_id, name, trigger_type, is_active, definition
           FROM workflows WHERE business_id = $1::uuid ORDER BY name""",
        store_id,
    )
    return [_row_to_workflow(r) for r in rows]


@app.get("/stores/{store_id}/executions")
async def get_executions(store_id: str):
    pool = await get_pool()
    exec_rows = await pool.fetch(
        """SELECT id, workflow_id, status, trigger, started_at
           FROM workflow_executions
           WHERE business_id = $1::uuid
           ORDER BY started_at DESC""",
        store_id,
    )
    result = []
    for exec_row in exec_rows:
        node_rows = await pool.fetch(
            """SELECT id, node_name, node_type, status,
                      input_json, output_json, error_message, started_at
               FROM workflow_node_executions
               WHERE execution_id = $1::uuid
               ORDER BY started_at""",
            exec_row["id"],
        )
        result.append(_row_to_execution(exec_row, node_rows))
    return result


@app.patch("/executions/{execution_id}/approve")
async def approve_execution(execution_id: str):
    """
    Mirror of approveWorkflowExecution() in app-provider.tsx:
    - Finds the CREATE_DRAFT_LISTING node to get the listingId
    - Rejects if listing price <= 0 (same error message as TS)
    - Publishes listing, marks execution success, updates the approval node
    All in one transaction.
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        exec_row = await conn.fetchrow(
            "SELECT id, workflow_id, status FROM workflow_executions WHERE id = $1::uuid",
            execution_id,
        )
        if not exec_row:
            raise HTTPException(status_code=404, detail="Execution not found")

        node_rows = await conn.fetch(
            """SELECT id, node_type, output_json
               FROM workflow_node_executions
               WHERE execution_id = $1::uuid ORDER BY started_at""",
            execution_id,
        )

        listing_node = next(
            (r for r in node_rows if r["node_type"] == "CREATE_DRAFT_LISTING"), None
        )
        if not listing_node:
            raise HTTPException(
                status_code=422, detail="No listing linked to this execution."
            )

        output: dict = listing_node["output_json"] or {}
        listing_id = output.get("listingId")
        if not listing_id:
            raise HTTPException(
                status_code=422, detail="No listing linked to this execution."
            )

        listing_row = await conn.fetchrow(
            "SELECT id, price FROM product_listings WHERE id = $1::uuid",
            listing_id,
        )
        if not listing_row:
            raise HTTPException(
                status_code=422, detail="Draft listing not found."
            )

        # Exact same check and message as app-provider.tsx line 320
        if float(listing_row["price"]) <= 0:
            raise HTTPException(
                status_code=422,
                detail="Set a product price before approving this listing.",
            )

        approved_at = datetime.now(timezone.utc)
        async with conn.transaction():
            await conn.execute(
                "UPDATE product_listings SET is_published = true WHERE id = $1::uuid",
                listing_id,
            )
            await conn.execute(
                """UPDATE workflow_executions
                   SET status = 'success', finished_at = $2
                   WHERE id = $1::uuid""",
                execution_id, approved_at,
            )
            await conn.execute(
                """UPDATE workflow_node_executions
                   SET status = 'success',
                       node_name = 'Seller approved and published listing',
                       output_json = $2,
                       finished_at = $3
                   WHERE execution_id = $1::uuid
                     AND node_type = 'REQUEST_HUMAN_APPROVAL'""",
                execution_id,
                {
                    "listingId": listing_id,
                    "published": True,
                    "approvedAt": approved_at.isoformat(),
                },
                approved_at,
            )

    return {
        "ok": True,
        "message": "Listing approved, published, and workflow completed.",
    }
