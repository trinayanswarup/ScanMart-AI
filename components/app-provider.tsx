"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialState } from "@/lib/seed";
import type { AppState, Business, CartItem, InventoryItem, Order, ProductAIExtraction } from "@/types";

type NewInventory = Omit<InventoryItem, "id" | "businessId" | "createdAt">;
type Checkout = { customerName: string; customerPhone?: string; customerEmail?: string };
type ListingDraft = { title: string; description: string; price: number };

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  currentStoreId: string | null;
  setCurrentStoreId: (id: string) => void;
  getStore: (id: string) => Business | undefined;
  getStoreInventory: (id: string) => InventoryItem[];
  getStoreListings: (id: string) => ReturnType<AppState["listings"]["filter"]>;
  getStoreOrders: (id: string) => Order[];
  addInventory: (storeId: string, item: NewInventory, original?: ProductAIExtraction, corrected?: ProductAIExtraction) => string;
  addInventoryBulk: (storeId: string, items: Array<{ name: string; category: string; quantity: number; price?: number }>) => number;
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void;
  publishItem: (id: string) => void;
  saveListing: (inventoryItemId: string, draft: ListingDraft) => { ok: boolean; message: string };
  addToCart: (listingId: string) => void;
  removeFromCart: (listingId: string) => void;
  setCartQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (customer: Checkout) => string[];
  updateOrderStatus: (id: string, status: Order["status"]) => { ok: boolean; message?: string };
  approveWorkflowExecution: (executionId: string) => { ok: boolean; message: string };
  updateBusiness: (storeId: string, patch: Partial<Business>) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = "scanmart_shared_v2";
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved) as AppState);
    } catch { /* start clean if browser data is invalid */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    try {
      let totalChars = 0;
      for (const key of Object.keys(localStorage)) {
        totalChars += key.length + (localStorage.getItem(key) ?? "").length;
      }
      // Each JS string character is 2 bytes in localStorage (UTF-16).
      // Warn well before the typical 5-10 MB browser limit.
      if (totalChars * 2 > 4 * 1024 * 1024) {
        console.warn(
          `[ScanMart] localStorage ~${(totalChars * 2 / 1024 / 1024).toFixed(1)} MB — approaching the browser limit. ` +
          "Images may fail to save. Consider archiving items or resetting demo data (Settings → Reset demo).",
        );
      }
    } catch { /* ignore storage-access errors in restricted environments */ }
  }, [hydrated, state]);

  const getStore = useCallback((id: string) => state.stores.find((s) => s.id === id), [state.stores]);
  const getStoreInventory = useCallback((id: string) => state.inventory.filter((item) => item.businessId === id), [state.inventory]);
  const getStoreListings = useCallback((id: string) => state.listings.filter((l) => l.businessId === id), [state.listings]);
  const getStoreOrders = useCallback((id: string) => state.orders.filter((o) => o.businessId === id), [state.orders]);

  const addInventory = useCallback((storeId: string, item: NewInventory, original?: ProductAIExtraction, corrected?: ProductAIExtraction) => {
    const id = makeId("inv");
    const inventoryItem: InventoryItem = { ...item, id, businessId: storeId, createdAt: new Date().toISOString() };
    setState((current) => {
      const workflow = current.workflows.find((entry) => entry.triggerType === "PRODUCT_SCANNED" && entry.businessId === storeId);
      const listingId = makeId("list");
      const executionId = makeId("exec");
      return {
        ...current,
        inventory: [inventoryItem, ...current.inventory],
        listings: item.source === "ai_scan"
          ? [{ id: listingId, businessId: storeId, inventoryItemId: id, title: item.name, description: item.description, price: item.price ?? 0, imageUrl: item.imageUrl, isPublished: false }, ...current.listings]
          : current.listings,
        corrections: original && corrected && JSON.stringify(original) !== JSON.stringify(corrected)
          ? [{ id: makeId("correction"), inventoryItemId: id, original, corrected, createdAt: new Date().toISOString() }, ...current.corrections]
          : current.corrections,
        executions: (workflow && item.source === "ai_scan") ? [{
          id: executionId,
          workflowId: workflow.id,
          status: "waiting_for_human",
          trigger: "PRODUCT_SCANNED",
          startedAt: new Date().toISOString(),
          nodes: [
            { id: makeId("node"), nodeName: "AI generated product description", nodeType: "GENERATE_PRODUCT_DESCRIPTION", status: "success", input: { inventoryItemId: id }, output: { description: item.description }, timestamp: new Date().toISOString() },
            { id: makeId("node"), nodeName: "Draft listing created", nodeType: "CREATE_DRAFT_LISTING", status: "success", input: { inventoryItemId: id }, output: { listingId }, timestamp: new Date().toISOString() },
            { id: makeId("node"), nodeName: "Waiting for seller approval", nodeType: "REQUEST_HUMAN_APPROVAL", status: "waiting_for_human", input: { listingId }, timestamp: new Date().toISOString() },
          ],
        } as const, ...current.executions] : current.executions,
      };
    });
    return id;
  }, []);

  // Bulk receipt import — uses source:"receipt", no workflow executions (avoids flooding Activity feed).
  const addInventoryBulk = useCallback((
    storeId: string,
    items: Array<{ name: string; category: string; quantity: number; price?: number }>,
  ) => {
    if (items.length === 0) return 0;
    const threshold = state.stores.find((s) => s.id === storeId)?.lowStockThreshold ?? 3;
    const newItems: InventoryItem[] = items.map((item) => ({
      id: makeId("inv"),
      businessId: storeId,
      name: item.name,
      category: item.category,
      description: "",
      quantity: item.quantity,
      unit: "pcs",
      lowStockThreshold: threshold,
      price: item.price,
      source: "receipt" as const,
      status: "active" as const,
      createdAt: new Date().toISOString(),
    }));
    setState((current) => ({ ...current, inventory: [...newItems, ...current.inventory] }));
    return items.length;
  }, [state.stores]);

  const updateInventory = useCallback((id: string, patch: Partial<InventoryItem>) => {
    setState((current) => ({ ...current, inventory: current.inventory.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  }, []);

  const publishItem = useCallback((id: string) => {
    setState((current) => {
      const item = current.inventory.find((entry) => entry.id === id);
      if (!item?.price) return current;
      const existing = current.listings.find((listing) => listing.inventoryItemId === id);
      const listings = existing
        ? current.listings.map((listing) => listing.inventoryItemId === id ? { ...listing, title: item.name, description: item.description, price: item.price!, isPublished: true } : listing)
        : [{ id: makeId("list"), businessId: item.businessId, inventoryItemId: id, title: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl, isPublished: true }, ...current.listings];
      return { ...current, listings };
    });
  }, []);

  const saveListing = useCallback((inventoryItemId: string, draft: ListingDraft) => {
    const title = draft.title.trim();
    const description = draft.description.trim();
    if (!title || !description || !Number.isFinite(draft.price) || draft.price <= 0) {
      return { ok: false, message: "Add a title, description, and valid price." };
    }
    setState((current) => {
      const inventoryItem = current.inventory.find((entry) => entry.id === inventoryItemId);
      if (!inventoryItem) return current;
      const existing = current.listings.find((entry) => entry.inventoryItemId === inventoryItemId);
      const listing = {
        id: existing?.id ?? makeId("list"),
        businessId: inventoryItem.businessId,
        inventoryItemId,
        title,
        description,
        price: draft.price,
        imageUrl: inventoryItem.imageUrl,
        isPublished: true,
      };
      return {
        ...current,
        inventory: current.inventory.map((entry) => entry.id === inventoryItemId ? { ...entry, name: title, description, price: draft.price } : entry),
        listings: existing
          ? current.listings.map((entry) => entry.id === existing.id ? listing : entry)
          : [listing, ...current.listings],
      };
    });
    return { ok: true, message: "Storefront listing updated." };
  }, []);

  const addToCart = useCallback((listingId: string) => {
    setState((current) => {
      const listing = current.listings.find((l) => l.id === listingId);
      if (!listing) return current;
      const store = current.stores.find((s) => s.id === listing.businessId);
      const invItem = current.inventory.find((i) => i.id === listing.inventoryItemId);
      if (!store || !invItem) return current;
      const existing = current.cart.find((c) => c.listingId === listingId);
      if (existing) {
        return { ...current, cart: current.cart.map((c) => c.listingId === listingId ? { ...c, quantity: c.quantity + 1 } : c) };
      }
      const newItem: CartItem = {
        storeId: store.id,
        storeName: store.name,
        listingId: listing.id,
        inventoryItemId: listing.inventoryItemId,
        productName: listing.title,
        price: listing.price,
        quantity: 1,
        imageUrl: invItem.imageUrl,
      };
      return { ...current, cart: [...current.cart, newItem] };
    });
  }, []);

  const removeFromCart = useCallback((listingId: string) => {
    setState((current) => ({ ...current, cart: current.cart.filter((c) => c.listingId !== listingId) }));
  }, []);

  const setCartQuantity = useCallback((listingId: string, quantity: number) => {
    setState((current) => ({
      ...current,
      cart: quantity <= 0
        ? current.cart.filter((item) => item.listingId !== listingId)
        : current.cart.map((item) => item.listingId === listingId ? { ...item, quantity } : item),
    }));
  }, []);

  const clearCart = useCallback(() => setState((current) => ({ ...current, cart: [] })), []);

  const placeOrder = useCallback((customer: Checkout): string[] => {
    const orderIds: string[] = [];
    setState((current) => {
      if (current.cart.length === 0) return current;

      // Group cart items by storeId
      const byStore = new Map<string, typeof current.cart>();
      for (const item of current.cart) {
        const list = byStore.get(item.storeId) ?? [];
        list.push(item);
        byStore.set(item.storeId, list);
      }

      // Validate all stock atomically before any mutation
      for (const [storeId, items] of byStore) {
        for (const cartItem of items) {
          const inv = current.inventory.find((i) => i.id === cartItem.inventoryItemId && i.businessId === storeId);
          if (!inv || inv.quantity < cartItem.quantity) return current;
        }
      }

      let next = { ...current };
      for (const [storeId, items] of byStore) {
        const orderId = makeId("ord");
        orderIds.push(orderId);
        const orderItems = items.map((cartItem) => ({
          id: makeId("oi"),
          listingId: cartItem.listingId,
          inventoryItemId: cartItem.inventoryItemId,
          name: cartItem.productName,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          lineTotal: cartItem.price * cartItem.quantity,
        }));
        const order: Order = {
          id: orderId,
          businessId: storeId,
          ...customer,
          status: "new",
          totalAmount: orderItems.reduce((sum, i) => sum + i.lineTotal, 0),
          items: orderItems,
          createdAt: new Date().toISOString(),
          stockReduced: false,
        };
        next = { ...next, orders: [order, ...next.orders] };
      }
      return { ...next, cart: [] };
    });
    return orderIds;
  }, []);

  const updateOrderStatus = useCallback((id: string, status: Order["status"]) => {
    // Validate synchronously against current state so the return value is reliable.
    // setState updaters run after this function returns, making in-updater assignments unreadable by the caller.
    const order = state.orders.find((entry) => entry.id === id);
    if (!order) return { ok: false, message: "Order not found." } as { ok: boolean; message?: string };
    if (status === "accepted" && !order.stockReduced) {
      const unavailable = order.items.find((orderItem) => (state.inventory.find((item) => item.id === orderItem.inventoryItemId)?.quantity ?? 0) < orderItem.quantity);
      if (unavailable) return { ok: false, message: `${unavailable.name} does not have enough stock.` };
    }
    setState((current) => {
      const o = current.orders.find((entry) => entry.id === id);
      if (!o) return current;
      if (status !== "accepted" || o.stockReduced) {
        return { ...current, orders: current.orders.map((entry) => entry.id === id ? { ...entry, status } : entry) };
      }
      // Re-validate inside updater to guard against any TOCTOU race
      const cantFulfill = o.items.find((orderItem) => (current.inventory.find((item) => item.id === orderItem.inventoryItemId)?.quantity ?? 0) < orderItem.quantity);
      if (cantFulfill) return current;
      const inventory = current.inventory.map((item) => {
        const ordered = o.items.find((entry) => entry.inventoryItemId === item.id);
        return ordered ? { ...item, quantity: item.quantity - ordered.quantity } : item;
      });
      const lowStock = inventory.filter((item) => o.items.some((entry) => entry.inventoryItemId === item.id) && item.quantity <= item.lowStockThreshold);
      const workflow = current.workflows.find((entry) => entry.triggerType === "ORDER_ACCEPTED" && entry.businessId === o.businessId);
      const execution = workflow ? {
        id: makeId("exec"), workflowId: workflow.id, status: "success" as const, trigger: "ORDER_ACCEPTED", startedAt: new Date().toISOString(),
        nodes: [
          { id: makeId("node"), nodeName: "Stock reduced", nodeType: "REDUCE_STOCK", status: "success" as const, input: { orderId: id }, output: { itemsUpdated: o.items.length }, timestamp: new Date().toISOString() },
          { id: makeId("node"), nodeName: "Low stock checked", nodeType: "CHECK_LOW_STOCK", status: "success" as const, input: { orderId: id }, output: { lowStockItems: lowStock.map((item) => item.name) }, timestamp: new Date().toISOString() },
          { id: makeId("node"), nodeName: "Seller notified", nodeType: "SEND_IN_APP_NOTIFICATION", status: "success" as const, input: { orderId: id }, output: { message: lowStock.length ? `${lowStock.length} item(s) need attention` : "Stock levels look healthy" }, timestamp: new Date().toISOString() },
        ],
      } : null;
      return { ...current, inventory, orders: current.orders.map((entry) => entry.id === id ? { ...entry, status, stockReduced: true } : entry), executions: execution ? [execution, ...current.executions] : current.executions };
    });
    return { ok: true } as { ok: boolean; message?: string };
  }, [state]);

  const approveWorkflowExecution = useCallback((executionId: string) => {
    let result = { ok: true, message: "Listing approved, published, and workflow completed." };
    setState((current) => {
      const execution = current.executions.find((e) => e.id === executionId);
      if (!execution) { result = { ok: false, message: "Execution not found." }; return current; }
      const listingNode = execution.nodes.find((n) => n.nodeType === "CREATE_DRAFT_LISTING");
      const listingId = listingNode?.output?.listingId as string | undefined;
      if (!listingId) { result = { ok: false, message: "No listing linked to this execution." }; return current; }
      const listing = current.listings.find((l) => l.id === listingId);
      if (!listing) { result = { ok: false, message: "Draft listing not found." }; return current; }
      if (listing.price <= 0) { result = { ok: false, message: "Set a product price before approving this listing." }; return current; }
      const approvedAt = new Date().toISOString();
      return {
        ...current,
        listings: current.listings.map((l) => l.id === listingId ? { ...l, isPublished: true } : l),
        executions: current.executions.map((e) => e.id === executionId ? {
          ...e,
          status: "success" as const,
          nodes: e.nodes.map((n) => n.status === "waiting_for_human" ? { ...n, nodeName: "Seller approved and published listing", status: "success" as const, output: { listingId, published: true, approvedAt }, timestamp: approvedAt } : n),
        } : e),
      };
    });
    return result;
  }, []);

  const updateBusiness = useCallback((storeId: string, patch: Partial<Business>) => {
    setState((current) => ({
      ...current,
      stores: current.stores.map((s) => s.id === storeId ? { ...s, ...patch } : s),
    }));
  }, []);

  const resetDemo = useCallback(() => setState(structuredClone(initialState)), []);

  const value = useMemo(() => ({
    state, hydrated, currentStoreId, setCurrentStoreId,
    getStore, getStoreInventory, getStoreListings, getStoreOrders,
    addInventory, addInventoryBulk, updateInventory, publishItem, saveListing,
    addToCart, removeFromCart, setCartQuantity, clearCart,
    placeOrder, updateOrderStatus, approveWorkflowExecution,
    updateBusiness, resetDemo,
  }), [
    state, hydrated, currentStoreId,
    getStore, getStoreInventory, getStoreListings, getStoreOrders,
    addInventory, addInventoryBulk, updateInventory, publishItem, saveListing,
    addToCart, removeFromCart, setCartQuantity, clearCart,
    placeOrder, updateOrderStatus, approveWorkflowExecution,
    updateBusiness, resetDemo,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
