import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { AppProvider, useApp } from "@/components/app-provider";

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

const wrapper = ({ children }: { children: React.ReactNode }) =>
  createElement(AppProvider, null, children);

async function setup() {
  const hook = renderHook(() => useApp(), { wrapper });
  // Let the hydration useEffect flush (reads localStorage, sets hydrated=true)
  await act(async () => {});
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
      orderIds = result.current.placeOrder({ customerName: "Jane Doe", customerPhone: "+1234567890" });
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
      orderIds = result.current.placeOrder({ customerName: "Jane Doe", customerPhone: "+1" });
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
      orderIds = result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
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
      orderIds = result.current.placeOrder({ customerName: "Ghost", customerPhone: "+0" });
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
      orderIds = result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
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
      orderIds = result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    const stockBefore = result.current.state.inventory
      .find((i) => i.id === "inv_gro_01")!.quantity;

    await act(async () => { result.current.updateOrderStatus(orderIds[0], "accepted"); });

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
      orderIds = result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    // First acceptance — reduces stock
    await act(async () => { result.current.updateOrderStatus(orderIds[0], "accepted"); });
    const stockAfterFirst = result.current.state.inventory
      .find((i) => i.id === "inv_gro_01")!.quantity;

    // Second acceptance — must NOT reduce stock again
    await act(async () => { result.current.updateOrderStatus(orderIds[0], "accepted"); });
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
      orderIds = result.current.placeOrder({ customerName: "Test", customerPhone: "+0" });
    });

    // Drain the inventory to 0 so the next acceptance fails
    await act(async () => { result.current.updateInventory("inv_gro_01", { quantity: 0 }); });

    let response: { ok: boolean; message?: string } = { ok: true };
    await act(async () => {
      response = result.current.updateOrderStatus(orderIds[0], "accepted");
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
      result.current.addInventory("biz_grocery_01", newManualItem);
    });

    expect(result.current.state.inventory).toHaveLength(countBefore + 1);
    expect(result.current.state.inventory[0].name).toBe("Manual Entry Product");
    expect(result.current.state.inventory[0].businessId).toBe("biz_grocery_01");
  });

  it("creates a workflow execution with waiting_for_human status when source is ai_scan", async () => {
    const { result } = await setup();
    const execCountBefore = result.current.state.executions.length;

    await act(async () => {
      result.current.addInventory("biz_grocery_01", newAiItem);
    });

    expect(result.current.state.executions).toHaveLength(execCountBefore + 1);
    const newExec = result.current.state.executions[0];
    expect(newExec.status).toBe("waiting_for_human");
    expect(newExec.trigger).toBe("PRODUCT_SCANNED");
    // Should have 3 nodes matching the workflow
    expect(newExec.nodes).toHaveLength(3);
    expect(newExec.nodes[2].status).toBe("waiting_for_human");
  });

  it("creates a draft listing (unpublished) when source is ai_scan", async () => {
    const { result } = await setup();
    const listingCountBefore = result.current.state.listings.length;

    await act(async () => {
      result.current.addInventory("biz_grocery_01", newAiItem);
    });

    expect(result.current.state.listings).toHaveLength(listingCountBefore + 1);
    const newListing = result.current.state.listings[0];
    expect(newListing.title).toBe("Amul Milk 1L");
    expect(newListing.isPublished).toBe(false);
    expect(newListing.price).toBe(60);
  });

  it("does NOT create a workflow execution when source is manual", async () => {
    const { result } = await setup();
    const execCountBefore = result.current.state.executions.length;

    await act(async () => {
      result.current.addInventory("biz_grocery_01", newManualItem);
    });

    expect(result.current.state.executions).toHaveLength(execCountBefore);
  });

  it("does NOT create a draft listing when source is manual", async () => {
    const { result } = await setup();
    const listingCountBefore = result.current.state.listings.length;

    await act(async () => {
      result.current.addInventory("biz_grocery_01", newManualItem);
    });

    expect(result.current.state.listings).toHaveLength(listingCountBefore);
  });
});
