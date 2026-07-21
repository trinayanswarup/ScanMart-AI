#!/usr/bin/env python3
"""
Populate the database with the same 3-store demo data as lib/seed.ts.

Run once after applying supabase/schema.sql + supabase/schema_additions.sql:
    python seed.py

The script is idempotent: it uses ON CONFLICT DO NOTHING on slug/id fields,
so re-running it is safe. UUIDs are generated fresh on the first run and
printed so you can record them for frontend wiring.
"""
import asyncio
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import asyncpg
from dotenv import load_dotenv

load_dotenv()

NOW = datetime.now(timezone.utc)


def days_ago(n: int) -> datetime:
    return NOW - timedelta(days=n)


def uid() -> str:
    return str(uuid.uuid4())


async def seed() -> None:
    conn = await asyncpg.connect(
        os.environ["DATABASE_URL"],
        statement_cache_size=0,
    )
    await conn.set_type_codec(
        "jsonb",
        encoder=json.dumps,
        decoder=json.loads,
        schema="pg_catalog",
    )

    try:
        async with conn.transaction():
            # ── Company ───────────────────────────────────────────────────────
            await conn.execute(
                "INSERT INTO company (id, name) VALUES ('co_01', 'ScanMart') "
                "ON CONFLICT (id) DO NOTHING",
            )

            # ── Stores ────────────────────────────────────────────────────────
            salon_id, cafe_id, grocery_id = uid(), uid(), uid()

            stores = [
                (salon_id,   "Urban Glow Salon",   "urban-glow",  "salon",   3),
                (cafe_id,    "Corner Café",         "corner-cafe", "cafe",    5),
                (grocery_id, "FreshMart Grocery",   "freshmart",   "grocery", 10),
            ]
            for bid, name, slug, btype, threshold in stores:
                await conn.execute(
                    """INSERT INTO businesses
                       (id, name, slug, business_type, default_low_stock_threshold)
                       VALUES ($1::uuid,$2,$3,$4,$5)
                       ON CONFLICT (slug) DO NOTHING""",
                    bid, name, slug, btype, threshold,
                )

            # ── Inventory: Urban Glow Salon ───────────────────────────────────
            inv = {}  # logical_key -> uuid str

            salon_items = [
                ("dove", salon_id, "Dove Intense Repair Shampoo", "Dove",       "Haircare",  "Nourishing shampoo for damaged hair.",          12, "pcs",   3,  349, "ai_scan",  0.94, NOW),
                ("wax",  salon_id, "Matte Finish Hair Wax",       None,         "Styling",   "Strong hold with a clean matte finish.",         2, "pcs",   3,  299, "manual",   None, NOW),
                ("razor",salon_id, "Professional Razor Blades",   None,         "Shaving",   "Stainless steel replacement blades.",            24, "packs", 5,  180, "import",   None, NOW),
                ("serum",salon_id, "Argan Hair Serum",            None,         "Haircare",  "Lightweight finishing serum for shine.",          8, "pcs",   3,  449, "ai_scan",  0.89, NOW),
            ]
            # Corner Café
            cafe_items = [
                ("coffee", cafe_id, "Ethiopian Arabica Coffee Beans", "Devoção", "Coffee",    "Single-origin Ethiopian Arabica beans with natural fruit notes. Medium roast, ideal for espresso and pour-over.", 15, "kg",    5,  1200, "ai_scan", 0.91, days_ago(5)),
                ("oat",    cafe_id, "Oat Milk 1L",                   "Oatly",   "Milk",      "Barista-grade oat milk for lattes and cappuccinos. Froths perfectly.",                                              4, "packs", 5,   220, "manual",  None, days_ago(3)),
                ("croiss", cafe_id, "Butter Croissants",             None,      "Bakery",    "Freshly baked all-butter croissants. Sourced daily from local bakery.",                                            12, "pcs",   5,    85, "manual",  None, days_ago(1)),
                ("cups",   cafe_id, "Paper Cups 350ml",              "Huhtamaki","Packaging", "Eco-friendly double-wall paper cups. Suitable for hot beverages up to 85°C.",                                    500, "pcs",  50,     3, "import",  None, days_ago(10)),
            ]
            # FreshMart Grocery
            grocery_items = [
                ("parle",    grocery_id, "Parle-G Biscuits 800g",        "Parle",      "Snacks",  "Classic glucose biscuits. India's most loved biscuit brand.",                60, "packs", 10,  50, "ai_scan", 0.96, days_ago(7)),
                ("amul",     grocery_id, "Amul Butter 500g",             "Amul",       "Dairy",   "Pasteurised table butter. Perfect for cooking and spreading.",                 8, "packs", 10, 275, "ai_scan", 0.88, days_ago(4)),
                ("salt",     grocery_id, "Tata Salt 1kg",                "Tata",       "Staples", "Iodised vacuum evaporated salt for everyday use.",                             35, "packs", 10,  28, "import",  None, days_ago(10)),
                ("bhujia",   grocery_id, "Haldiram's Aloo Bhujia 400g", "Haldiram's", "Snacks",  "Crispy spiced potato noodle snack. Popular across all age groups.",            22, "packs", 10,  95, "manual",  None, days_ago(2)),
            ]

            all_items = salon_items + cafe_items + grocery_items
            for key, bid, name, brand, cat, desc, qty, unit, thresh, price, src, conf, created in all_items:
                iid = await conn.fetchval(
                    """INSERT INTO inventory_items
                       (business_id, name, brand, category, description, quantity, unit,
                        low_stock_threshold, price, source, ai_confidence, status, created_at)
                       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active',$12)
                       RETURNING id""",
                    bid, name, brand, cat, desc, qty, unit, thresh, price, src, conf, created,
                )
                inv[key] = str(iid)

            # ── Listings ──────────────────────────────────────────────────────
            lst: dict[str, str] = {}  # key -> uuid str

            listings_spec = [
                # (key, inv_key,  bid,        title,                                       desc,                                                             price, published)
                ("list_dove",   "dove",   salon_id,   "Dove Intense Repair Shampoo",          "Nourishing shampoo for damaged hair.",                            349,  True),
                ("list_wax",    "wax",    salon_id,   "Matte Finish Hair Wax",                "Strong hold with a clean matte finish.",                           299,  True),
                ("list_serum",  "serum",  salon_id,   "Argan Hair Serum",                     "Lightweight finishing serum for shine.",                            449,  False),
                ("list_coffee", "coffee", cafe_id,    "Ethiopian Arabica Coffee Beans",        "Single-origin Ethiopian Arabica beans with natural fruit notes. Medium roast.", 1200, True),
                ("list_oat",    "oat",    cafe_id,    "Oatly Oat Milk 1L",                    "Barista-grade oat milk. Froths perfectly for lattes.",              220,  False),
                ("list_croiss", "croiss", cafe_id,    "Freshly Baked Butter Croissants",      "All-butter croissants sourced from local bakery.",                   85,  True),
                ("list_parle",  "parle",  grocery_id, "Parle-G Biscuits 800g",               "Classic glucose biscuits. India's most loved biscuit brand.",        50,  True),
                ("list_salt",   "salt",   grocery_id, "Tata Salt 1kg",                        "Iodised vacuum evaporated salt.",                                    28,  True),
                ("list_bhujia", "bhujia", grocery_id, "Haldiram's Aloo Bhujia 400g",         "Crispy spiced potato noodle snack.",                                 95,  False),
            ]
            for lkey, ikey, bid, title, desc, price, published in listings_spec:
                lid = await conn.fetchval(
                    """INSERT INTO product_listings
                       (business_id, inventory_item_id, title, description, price, is_published)
                       VALUES ($1::uuid,$2::uuid,$3,$4,$5,$6)
                       RETURNING id""",
                    bid, inv[ikey], title, desc, price, published,
                )
                lst[lkey] = str(lid)

            # ── Workflows ─────────────────────────────────────────────────────
            wf: dict[str, str] = {}

            workflows_spec = [
                ("wf_salon_ps",  salon_id,   "Create draft listing from scanned product", "PRODUCT_SCANNED",   True, {"description": "Turns a confirmed scan into a reviewable storefront draft.", "nodeNames": ["Generate product description", "Create draft listing", "Request human approval"]}),
                ("wf_salon_oa",  salon_id,   "Reduce stock when order is accepted",       "ORDER_ACCEPTED",    True, {"description": "Updates inventory and checks stock health after a sale.", "nodeNames": ["Reduce stock", "Check low stock", "Send in-app notification"]}),
                ("wf_salon_ls",  salon_id,   "Low stock reorder reminder",                "LOW_STOCK_DETECTED",True, {"description": "Creates a seller task when an item needs replenishment.", "nodeNames": ["Create seller task", "Send in-app notification"]}),
                ("wf_cafe_ps",   cafe_id,    "New Product Scanned",                       "PRODUCT_SCANNED",   True, {"description": "Auto-create draft listing when a product is scanned.", "nodeNames": ["AI generated product description", "Draft listing created", "Waiting for seller approval"]}),
                ("wf_cafe_oa",   cafe_id,    "Order Accepted",                            "ORDER_ACCEPTED",    True, {"description": "Reduce stock and notify customer on order acceptance.", "nodeNames": ["Validate stock availability", "Reduce stock", "Send customer notification"]}),
                ("wf_cafe_ls",   cafe_id,    "Low Stock Alert",                           "LOW_STOCK_DETECTED",True, {"description": "Alert owner when item falls below reorder threshold.", "nodeNames": ["Detect low stock", "Create reorder task", "Send owner notification"]}),
                ("wf_gro_ps",    grocery_id, "New Product Scanned",                       "PRODUCT_SCANNED",   True, {"description": "Auto-create draft listing when a product is scanned.", "nodeNames": ["AI generated product description", "Draft listing created", "Waiting for seller approval"]}),
                ("wf_gro_oa",    grocery_id, "Order Accepted",                            "ORDER_ACCEPTED",    True, {"description": "Reduce stock and notify customer on order acceptance.", "nodeNames": ["Validate stock availability", "Reduce stock", "Send customer notification"]}),
                ("wf_gro_ls",    grocery_id, "Low Stock Alert",                           "LOW_STOCK_DETECTED",True, {"description": "Alert owner when item falls below reorder threshold.", "nodeNames": ["Detect low stock", "Create reorder task", "Send owner notification"]}),
            ]
            for wkey, bid, name, trigger, active, defn in workflows_spec:
                wid = await conn.fetchval(
                    """INSERT INTO workflows
                       (business_id, name, trigger_type, is_active, definition)
                       VALUES ($1::uuid,$2,$3,$4,$5)
                       RETURNING id""",
                    bid, name, trigger, active, defn,
                )
                wf[wkey] = str(wid)

            # ── Executions ────────────────────────────────────────────────────
            # Salon: Argan Hair Serum — waiting for human approval
            serum_exec_id = await conn.fetchval(
                """INSERT INTO workflow_executions
                   (workflow_id, business_id, status, trigger, input_json)
                   VALUES ($1::uuid,$2::uuid,'waiting_for_human','PRODUCT_SCANNED',$3)
                   RETURNING id""",
                wf["wf_salon_ps"], salon_id, {"inventoryItemId": inv["serum"]},
            )
            serum_eid = str(serum_exec_id)
            for name, ntype, status, inp, out in [
                ("AI generated product description", "GENERATE_PRODUCT_DESCRIPTION", "success",
                 {"inventoryItemId": inv["serum"]}, {"description": "Lightweight finishing serum for shine."}),
                ("Draft listing created", "CREATE_DRAFT_LISTING", "success",
                 {"inventoryItemId": inv["serum"]}, {"listingId": lst["list_serum"]}),
                ("Waiting for seller approval", "REQUEST_HUMAN_APPROVAL", "waiting_for_human",
                 {"listingId": lst["list_serum"]}, None),
            ]:
                await conn.execute(
                    """INSERT INTO workflow_node_executions
                       (execution_id, node_id, node_name, node_type, status,
                        input_json, output_json, started_at, finished_at)
                       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9)""",
                    serum_eid, uid(), name, ntype, status, inp, out, NOW,
                    NOW if status != "waiting_for_human" else None,
                )

            # Café: Coffee — waiting for human approval
            coffee_exec_id = await conn.fetchval(
                """INSERT INTO workflow_executions
                   (workflow_id, business_id, status, trigger, input_json)
                   VALUES ($1::uuid,$2::uuid,'waiting_for_human','PRODUCT_SCANNED',$3)
                   RETURNING id""",
                wf["wf_cafe_ps"], cafe_id, {"inventoryItemId": inv["coffee"]},
            )
            coffee_eid = str(coffee_exec_id)
            for name, ntype, status, inp, out in [
                ("AI generated product description", "GENERATE_PRODUCT_DESCRIPTION", "success",
                 {"inventoryItemId": inv["coffee"]}, {"description": "Single-origin Ethiopian Arabica beans."}),
                ("Draft listing created", "CREATE_DRAFT_LISTING", "success",
                 {"inventoryItemId": inv["coffee"]}, {"listingId": lst["list_coffee"]}),
                ("Waiting for seller approval", "REQUEST_HUMAN_APPROVAL", "waiting_for_human",
                 {"listingId": lst["list_coffee"]}, None),
            ]:
                await conn.execute(
                    """INSERT INTO workflow_node_executions
                       (execution_id, node_id, node_name, node_type, status,
                        input_json, output_json, started_at, finished_at)
                       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9)""",
                    coffee_eid, uid(), name, ntype, status, inp, out, days_ago(3),
                    days_ago(3) if status != "waiting_for_human" else None,
                )

            # ── Orders ────────────────────────────────────────────────────────
            # Corner Café — completed order (stock already reduced)
            cafe_order_id = await conn.fetchval(
                """INSERT INTO orders
                   (business_id, customer_name, customer_phone, status,
                    total_amount, stock_reduced_at, created_at)
                   VALUES ($1::uuid,'Priya Mehta','+91 9876543210','completed',1370,$2,$3)
                   RETURNING id""",
                cafe_id, days_ago(2), days_ago(2),
            )
            cafe_oid = str(cafe_order_id)
            for lid_key, inv_key, name, qty, price in [
                ("list_coffee", "coffee", "Ethiopian Arabica Coffee Beans", 1, 1200),
                ("list_croiss", "croiss", "Freshly Baked Butter Croissants", 2, 85),
            ]:
                await conn.execute(
                    """INSERT INTO order_items
                       (order_id, product_listing_id, inventory_item_id, name,
                        quantity, unit_price, line_total)
                       VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7)""",
                    cafe_oid, lst[lid_key], inv[inv_key], name, qty, price, qty * price,
                )

            # FreshMart — accepted order (stock already reduced)
            gro_order_id = await conn.fetchval(
                """INSERT INTO orders
                   (business_id, customer_name, customer_phone, status,
                    total_amount, stock_reduced_at, created_at)
                   VALUES ($1::uuid,'Rahul Sharma','+91 9988776655','accepted',373,$2,$3)
                   RETURNING id""",
                grocery_id, days_ago(1), days_ago(1),
            )
            gro_oid = str(gro_order_id)
            for lid_key, inv_key, name, qty, price in [
                ("list_parle",  "parle",  "Parle-G Biscuits 800g",         5, 50),
                ("list_salt",   "salt",   "Tata Salt 1kg",                  3, 28),
                ("list_bhujia", "bhujia", "Haldiram's Aloo Bhujia 400g",   1, 95),
            ]:
                await conn.execute(
                    """INSERT INTO order_items
                       (order_id, product_listing_id, inventory_item_id, name,
                        quantity, unit_price, line_total)
                       VALUES ($1::uuid,$2::uuid,$3::uuid,$4,$5,$6,$7)""",
                    gro_oid, lst[lid_key], inv[inv_key], name, qty, price, qty * price,
                )

        # Print generated IDs so they can be recorded for frontend migration
        print("\n✓ Seeding complete!\n")
        print("Generated store IDs (needed when wiring the Next.js frontend):")
        print(f"  salon_id   = {salon_id}")
        print(f"  cafe_id    = {cafe_id}")
        print(f"  grocery_id = {grocery_id}")
        print("\nInventory IDs:")
        for k, v in inv.items():
            print(f"  {k:12s} = {v}")
        print("\nListing IDs:")
        for k, v in lst.items():
            print(f"  {k:14s} = {v}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
