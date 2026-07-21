import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { AppProvider, useApp } from "@/components/app-provider";
import { initialState } from "@/lib/seed";
import type { AppState, InventoryItem, Order } from "@/types";

// Seed data IDs (from lib/seed.ts) used throughout these tests.
// Salon  → biz_salon_01
//   inv_1  = Dove Shampoo,      qty 12,  price 349  (listing list_1, published)
//   inv_2  = Hair Wax,          qty 2,   price 299  (listing list_2, published)
// Café   → biz_cafe_01
//   inv_cafe_01 = Coffee Beans, qty 15, price 1200  (listing list_cafe_01, published)
//   inv_cafe_03 = Croissants,   qty 12, price 85    (listing list_cafe_03, published)
// Grocery → biz_grocery_01
//   inv_gro_01  = Parle-G,      qty 60, price 50   (listing list_gro_01, published)
//   inv_gro_03  = Tata Salt,    qty 35, price 28   (listing list_gro_02, published)

// ─── Fetch mock ─────────────────────────────────────────────────────────────
// Simulates the FastAPI backend using a mutable copy of initialState per test.

function createFetchMock(s: AppState) {
  const resp = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
  const fail422 = (detail: string) =>
    new Response(JSON.stringify({ detail }), { status: 422, headers: { "Content-Type": "application/json" } });

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    // ── GETs ──
    if (method === "GET") {
      if (url.endsWith("/company")) return resp(s.company);
      if (url.endsWith("/stores")) return resp(s.stores);
      const m = url.match(/\/stores\/([^/]+)\/(\w+)/);
      if (m) {
        const [, sid, resource] = m;
        if (resource === "inventory") return resp(s.inventory.filter(i => i.businessId === sid));
        if (resource === "listings") return resp(s.listings.filter(l => l.businessId === sid));
        if (resource === "orders") return resp(s.orders.filter(o => o.businessId === sid));
        if (resource === "workflows") return resp(s.workflows.filter(w => w.businessId === sid));
        if (resource === "executions") return resp(s.executions.filter(e => {
          const wf = s.workflows.find(w => w.id === e.workflowId);
          return wf?.businessId === sid;
        }));
      }
    }

    // ── POST /stores/{id}/inventory ──
    if (method === "POST") {
      const storeMatch = url.match(/\/stores\/([^/]+)\/inventory$/);
      if (storeMatch) {
        const storeId = storeMatch[1];
        const id = `inv_mock_${Math.random().toString(36).slice(2)}`;
        const newItem: InventoryItem = {
          id, businessId: storeId,
          name: body.name, brand: body.brand ?? undefined,
          category: body.category, description: body.description ?? "",
          quantity: body.quantity ?? 0, unit: body.unit ?? "pcs",
          lowStockThreshold: body.lowStockThreshold ?? 3,
          price: body.price ?? undefined, imageUrl: body.imageUrl ?? undefined,
          source: body.source, aiConfidence: body.aiConfidence ?? undefined,
          status: body.status ?? "active",
          createdAt: new Date().toISOString(),
        };
        s.inventory.unshift(newItem);
        if (body.source === "ai_scan") {
          const wf = s.workflows.find(w => w.triggerType === "PRODUCT_SCANNED" && w.businessId === storeId);
          if (wf) {
            const listingId = `list_mock_${Math.random().toString(36).slice(2)}`;
            const ts = new Date().toISOString();
            s.listings.unshift({
              id: listingId, businessId: storeId, inventoryItemId: id,
              title: body.name, description: body.description ?? "",
              price: body.price ?? 0, imageUrl: body.imageUrl ?? undefined, isPublished: false,
            });
            s.executions.unshift({
              id: `exec_mock_${Math.random().toString(36).slice(2)}`,
              workflowId: wf.id, status: "waiting_for_human",
              trigger: "PRODUCT_SCANNED", startedAt: ts,
              nodes: [
                { id: `n1_${Math.random().toString(36).slice(2)}`, nodeName: "AI generated product description", nodeType: "GENERATE_PRODUCT_DESCRIPTION", status: "success", input: { inventoryItemId: id }, output: { description: body.description }, timestamp: ts },
                { id: `n2_${Math.random().toString(36).slice(2)}`, nodeName: "Draft listing created", nodeType: "CREATE_DRAFT_LISTING", status: "success", input: { inventoryItemId: id }, output: { listingId }, timestamp: ts },
                { id: `n3_${Math.random().toString(36).slice(2)}`, nodeName: "Waiting for seller approval", nodeType: "REQUEST_HUMAN_APPROVAL", status: "waiting_for_human", input: { listingId }, timestamp: ts },
              ],
            });
          }
        }
        return resp(newItem);
      }

      // ── POST /orders ──
      if (url.endsWith("/orders")) {
        for (const ci of body.cart) {
          const inv = s.inventory.find(i => i.id === ci.inventoryItemId);
          if (!inv || inv.quantity < ci.quantity) return fail422(`${ci.productName} does not have enough stock.`);
        }
        const byStore = new Map<string, typeof body.cart>();
        for (const ci of body.cart) {
          const list = byStore.get(ci.storeId) ?? [];
          list.push(ci); byStore.set(ci.storeId, list);
        }
        const orderIds: string[] = [];
        for (const [storeId, items] of byStore) {
          const orderId = `ord_mock_${Math.random().toString(36).slice(2)}`;
          orderIds.push(orderId);
          const order: Order = {
            id: orderId, businessId: storeId,
            customerName: body.customerName, customerPhone: body.customerPhone, customerEmail: body.customerEmail,
            status: "new",
            totalAmount: (items as Array<{ price: number; quantity: number }>).reduce((sum, i) => sum + i.price * i.quantity, 0),
            items: (items as Array<{ listingId: string; inventoryItemId: string; productName: string; price: number; quantity: number }>).map(i => ({
              id: `oi_${Math.random().toString(36).slice(2)}`,
              listingId: i.listingId, inventoryItemId: i.inventoryItemId,
              name: i.productName, quantity: i.quantity, unitPrice: i.price, lineTotal: i.price * i.quantity,
            })),
            createdAt: new Date().toISOString(), stockReduced: false,
          };
          s.orders.unshift(order);
        }
        return resp({ orderIds });
      }
    }

    if (method === "PATCH") {
      // ── PATCH /inventory/{id} ──
      const invM = url.match(/\/inventory\/([^/]+)$/);
      if (invM) {
        const item = s.inventory.find(i => i.id === invM[1]);
        if (!item) return fail422("Not found");
        Object.assign(item, body);
        return resp(item);
      }

      // ── PATCH /orders/{id}/status ──
      const ordM = url.match(/\/orders\/([^/]+)\/status$/);
      if (ordM) {
        const order = s.orders.find(o => o.id === ordM[1]);
        if (!order) return fail422("Order not found.");
        if (body.status === "accepted" && !order.stockReduced) {
          for (const oi of order.items) {
            const inv = s.inventory.find(i => i.id === oi.inventoryItemId);
            if (!inv || inv.quantity < oi.quantity) return fail422(`${oi.name} does not have enough stock.`);
          }
          for (const oi of order.items) {
            const inv = s.inventory.find(i => i.id === oi.inventoryItemId);
            if (inv) inv.quantity -= oi.quantity;
          }
          order.stockReduced = true;
        }
        order.status = body.status;
        return resp(order);
      }

      // ── PATCH /listings/{id} ──
      const listM = url.match(/\/listings\/([^/]+)$/);
      if (listM) {
        const listing = s.listings.find(l => l.id === listM[1]);
        if (!listing) return fail422("Not found");
        Object.assign(listing, body);
        return resp(listing);
      }

      // ── PATCH /executions/{id}/approve ──
      const execM = url.match(/\/executions\/([^/]+)\/approve$/);
      if (execM) {
        const exec = s.executions.find(e => e.id === execM[1]);
        if (!exec) return fail422("Execution not found.");
        const listingId = exec.nodes.find(n => n.nodeType === "CREATE_DRAFT_LISTING")?.output?.listingId as string | undefined;
        const listing = s.listings.find(l => l.id === listingId);
        if (!listing || listing.price <= 0) return fail422("Set a product price before approving this listing.");
        listing.isPublished = true;
        exec.status = "success";
        return resp({ ok: true, message: "Listing approved, published, and workflow completed." });
      }
    }

    return resp({});
  };
}

let mockState: AppState;

beforeEach(() => {
  mockState = structuredClone(initialState);
  vi.stubGlobal("fetch", createFetchMock(mockState));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(AppProvider, null, children);

async function setup() {
  const hook = renderHook(() => useApp(), { wrapper });

  // Wait for the base load: company + stores list.
  await waitFor(() => {
    expect(hook.result.current?.state.stores.length).toBeGreaterThan(0);
  });

  // In jsdom, usePathname() returns null so initialAdminStoreId is null and no
  // per-store data is pre-loaded. Trigger the lazy load for each store in turn,
  // waiting for inventory to arrive before moving to the next (avoids the
  // cancellation that would happen if we changed currentStoreId mid-fetch).
  for (const storeId of ["biz_salon_01", "biz_cafe_01", "biz_grocery_01"] as const) {
    await act(async () => { hook.result.current?.setCurrentStoreId(storeId); });
    await waitFor(() => {
      expect(
        hook.result.current?.state.inventory.filter(i => i.businessId === storeId).length
      ).toBeGreaterThan(0);
    });
  }

  return hook;
}

// ─── addToCart / setCartQuantity ────────────────────────────────────────────

describe("addToCart", () => {
  it("adds a new listing with quantity 1", async () => {
    const { result } = await setup();

    await act(async () => { result.current.addToCart("list_1"); });

    expect(result.current.state.cart).toHaveLength(1);
    expect(result.current.state.cart[0].listingId).toBe("list_1");
    expect(result.current.state.cart[0].quantity).toBe(1);
    expect(result.current.state.cart[0].productName).toBe("Dove Intense Repair Shampoo");
    expect(result.current.state.cart[0].price).toBe(349);
    expect(result.current.state.cart[0].storeId).toBe("biz_salon_01");
  });

  it("increments quantity when the same listing is added twice", async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.addToCart("list_1");
      result.current.addToCart("list_1");
    });

    expect(result.current.state.cart).toHaveLength(1);
    expect(result.current.state.cart[0].quantity).toBe(2);
  });

  it("adds items from two different stores as separate cart entries", async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.addToCart("list_1");       // salon
      result.current.addToCart("list_cafe_01"); // café
    });

    expect(result.current.state.cart).toHaveLength(2);
    const stores = result.current.state.cart.map((c) => c.storeId);
    expect(stores).toContain("biz_salon_01");
    expect(stores).toContain("biz_cafe_01");
  });

  it("does nothing for an unknown listingId", async () => {
    const { result } = await setup();

    await act(async () => { result.current.addToCart("list_does_not_exist"); });

    expect(result.current.state.cart).toHaveLength(0);
  });
});

describe("setCartQuantity", () => {
  it("updates quantity for an existing cart item", async () => {
    const { result } = await setup();

    await act(async () => { result.current.addToCart("list_1"); });
    await act(async () => { result.current.setCartQuantity("list_1", 5); });

    expect(result.current.state.cart[0].quantity).toBe(5);
  });

  it("removes item from cart when quantity is set to 0", async () => {
    const { result } = await setup();

    await act(async () => { result.current.addToCart("list_1"); });
    await act(async () => { result.current.setCartQuantity("list_1", 0); });

    expect(result.current.state.cart).toHaveLength(0);
  });

  it("removes item from cart when quantity is negative", async () => {
    const { result } = await setup();

    await act(async () => { result.current.addToCart("list_1"); });
    await act(async () => { result.current.setCartQuantity("list_1", -1); });

    expect(result.current.state.cart).toHaveLength(0);
  });
});

// ─── placeOrder ─────────────────────────────────────────────────────────────

describe("placeOrder", () => {
  it("returns an orderId per store and clears the cart", async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.addToCart("list_1");       // salon, €349
      result.current.addToCart("list_cafe_01"); // café,  €1200
    });

    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Jane Doe", customerPhone: "+1234567890" });
    });

    expect(orderIds).toHaveLength(2);
    expect(result.current.state.cart).toHaveLength(0);
  });

  it("creates orders with correct totals split by store", async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.addToCart("list_1");       // salon: €349 × 1
      result.current.addToCart("list_cafe_01"); // café:  €1200 × 1
    });

    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Jane Doe", customerPhone: "+1" });
    });

    const salonOrder = result.current.state.orders.find(
      (o) => o.id === orderIds.find((id) =>
        result.current.state.orders.find((o2) => o2.id === id)?.businessId === "biz_salon_01"
      )
    );
    const cafeOrder = result.current.state.orders.find(
      (o) => o.businessId === "biz_cafe_01" && orderIds.includes(o.id)
    );

    expect(salonOrder?.totalAmount).toBe(349);
    expect(salonOrder?.status).toBe("new");
    expect(salonOrder?.stockReduced).toBe(false);
    expect(cafeOrder?.totalAmount).toBe(1200);
  });

  it("calculates totalAmount correctly across multiple items and quantities", async () => {
    const { result } = await setup();

    await act(async () => {
      result.current.addToCart("list_gro_01"); // Parle-G €50
      result.current.addToCart("list_gro_02"); // Tata Salt €28
    });
    await act(async () => {
      result.current.setCartQuantity("list_gro_01", 3); // 3 × 50 = 150
      result.current.setCartQuantity("list_gro_02", 2); // 2 × 28 = 56
    });

    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    expect(orderIds).toHaveLength(1);
    const order = result.current.state.orders.find((o) => o.id === orderIds[0]);
    expect(order?.totalAmount).toBe(150 + 56); // 206
    expect(order?.items).toHaveLength(2);
  });

  it("returns empty array and leaves orders unchanged for an empty cart", async () => {
    const { result } = await setup();
    const countBefore = result.current.state.orders.length;

    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Ghost", customerPhone: "+0" });
    });

    expect(orderIds).toHaveLength(0);
    expect(result.current.state.orders).toHaveLength(countBefore);
  });

  it("rejects atomically if any item exceeds available stock", async () => {
    const { result } = await setup();

    // Hair Wax has only qty=2; request 99
    await act(async () => { result.current.addToCart("list_2"); });
    await act(async () => { result.current.setCartQuantity("list_2", 99); });

    const orderCountBefore = result.current.state.orders.length;
    let orderIds: string[] = [];
    await act(async () => {
      try {
        // Backend returns 422 for insufficient stock — placeOrder throws
        orderIds = await result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
      } catch { /* expected */ }
    });

    expect(orderIds).toHaveLength(0);
    expect(result.current.state.orders).toHaveLength(orderCountBefore);
    // Cart should NOT be cleared on a rejected order
    expect(result.current.state.cart).toHaveLength(1);
  });
});

// ─── updateOrderStatus ───────────────────────────────────────────────────────

describe("updateOrderStatus — stock reduction", () => {
  it("reduces stock by the ordered quantity on first acceptance", async () => {
    const { result } = await setup();

    // Place a fresh order for 2 × Parle-G (inv_gro_01 starts at qty=60)
    await act(async () => { result.current.addToCart("list_gro_01"); });
    await act(async () => { result.current.setCartQuantity("list_gro_01", 2); });

    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    const stockBefore = result.current.state.inventory
      .find((i) => i.id === "inv_gro_01")!.quantity;

    await act(async () => { await result.current.updateOrderStatus(orderIds[0], "accepted"); });

    const stockAfter = result.current.state.inventory
      .find((i) => i.id === "inv_gro_01")!.quantity;

    expect(stockAfter).toBe(stockBefore - 2);
    expect(result.current.state.orders.find((o) => o.id === orderIds[0])?.stockReduced).toBe(true);
  });

  it("does NOT reduce stock a second time when already stockReduced (idempotent)", async () => {
    const { result } = await setup();

    await act(async () => { result.current.addToCart("list_gro_01"); });
    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    // First acceptance — reduces stock
    await act(async () => { await result.current.updateOrderStatus(orderIds[0], "accepted"); });
    const stockAfterFirst = result.current.state.inventory
      .find((i) => i.id === "inv_gro_01")!.quantity;

    // Second acceptance — must NOT reduce stock again
    await act(async () => { await result.current.updateOrderStatus(orderIds[0], "accepted"); });
    const stockAfterSecond = result.current.state.inventory
      .find((i) => i.id === "inv_gro_01")!.quantity;

    expect(stockAfterSecond).toBe(stockAfterFirst);
  });

  it("returns ok:false and leaves order unchanged when stock is insufficient at accept time", async () => {
    const { result } = await setup();

    // Place an order for 1 × Parle-G
    await act(async () => { result.current.addToCart("list_gro_01"); });
    let orderIds: string[] = [];
    await act(async () => {
      orderIds = await result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    // Drain the inventory to 0 so the next acceptance fails
    await act(async () => { await result.current.updateInventory("inv_gro_01", { quantity: 0 }); });

    let response: { ok: boolean; message?: string } = { ok: true };
    await act(async () => {
      response = await result.current.updateOrderStatus(orderIds[0], "accepted");
    });

    expect(response.ok).toBe(false);
    expect(response.message).toMatch(/parle/i);
    // Order status must remain "new"
    expect(result.current.state.orders.find((o) => o.id === orderIds[0])?.status).toBe("new");
    // Stock must not have changed (still 0)
    expect(result.current.state.inventory.find((i) => i.id === "inv_gro_01")?.quantity).toBe(0);
  });
});

// ─── addInventory ───────────────────────────────────────────────────────────

describe("addInventory", () => {
  const newAiItem = {
    name: "Amul Milk 1L",
    category: "Dairy",
    description: "Full cream pasteurised milk.",
    quantity: 20,
    unit: "pcs",
    lowStockThreshold: 5,
    price: 60,
    source: "ai_scan" as const,
    status: "active" as const,
  };

  const newManualItem = {
    name: "Manual Entry Product",
    category: "Other",
    description: "Added by store admin manually.",
    quantity: 5,
    unit: "pcs",
    lowStockThreshold: 1,
    source: "manual" as const,
    status: "active" as const,
  };

  it("always adds the inventory item regardless of source", async () => {
    const { result } = await setup();
    const countBefore = result.current.state.inventory.length;

    await act(async () => {
      await result.current.addInventory("biz_grocery_01", newManualItem);
    });

    expect(result.current.state.inventory).toHaveLength(countBefore + 1);
    const added = result.current.state.inventory.find((i) => i.name === "Manual Entry Product");
    expect(added).toBeDefined();
    expect(added?.businessId).toBe("biz_grocery_01");
  });

  it("creates a workflow execution with waiting_for_human status when source is ai_scan", async () => {
    const { result } = await setup();
    const execCountBefore = result.current.state.executions.length;

    await act(async () => {
      await result.current.addInventory("biz_grocery_01", newAiItem);
    });

    expect(result.current.state.executions).toHaveLength(execCountBefore + 1);
    // Find the new grocery execution (grocery had 0 seeded executions)
    const groceryWf = result.current.state.workflows.find(
      (w) => w.businessId === "biz_grocery_01" && w.triggerType === "PRODUCT_SCANNED"
    );
    const newExec = result.current.state.executions.find(
      (e) => e.workflowId === groceryWf?.id
    );
    expect(newExec).toBeDefined();
    expect(newExec?.status).toBe("waiting_for_human");
    expect(newExec?.trigger).toBe("PRODUCT_SCANNED");
    // Should have 3 nodes matching the workflow
    expect(newExec?.nodes).toHaveLength(3);
    expect(newExec?.nodes[2].status).toBe("waiting_for_human");
  });

  it("creates a draft listing (unpublished) when source is ai_scan", async () => {
    const { result } = await setup();
    const listingCountBefore = result.current.state.listings.length;

    await act(async () => {
      await result.current.addInventory("biz_grocery_01", newAiItem);
    });

    expect(result.current.state.listings).toHaveLength(listingCountBefore + 1);
    const newListing = result.current.state.listings.find((l) => l.title === "Amul Milk 1L");
    expect(newListing).toBeDefined();
    expect(newListing?.isPublished).toBe(false);
    expect(newListing?.price).toBe(60);
  });

  it("does NOT create a workflow execution when source is manual", async () => {
    const { result } = await setup();
    const execCountBefore = result.current.state.executions.length;

    await act(async () => {
      await result.current.addInventory("biz_grocery_01", newManualItem);
    });

    expect(result.current.state.executions).toHaveLength(execCountBefore);
  });

  it("does NOT create a draft listing when source is manual", async () => {
    const { result } = await setup();
    const listingCountBefore = result.current.state.listings.length;

    await act(async () => {
      await result.current.addInventory("biz_grocery_01", newManualItem);
    });

    expect(result.current.state.listings).toHaveLength(listingCountBefore);
  });
});
