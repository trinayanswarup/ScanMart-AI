"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type {
  AppState, Business, CartItem, Company, InventoryItem, Order,
  ProductAIExtraction, ProductListing, Workflow, WorkflowExecution,
} from "@/types";

type NewInventory = Omit<InventoryItem, "id" | "businessId" | "createdAt">;
type Checkout = { customerName: string; customerPhone?: string; customerEmail?: string };
type ListingDraft = { title: string; description: string; price: number };

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  storeDataLoading: boolean;
  currentStoreId: string | null;
  setCurrentStoreId: (id: string) => void;
  loadAllStores: () => Promise<void>;
  getStore: (id: string) => Business | undefined;
  getStoreInventory: (id: string) => InventoryItem[];
  getStoreListings: (id: string) => ReturnType<AppState["listings"]["filter"]>;
  getStoreOrders: (id: string) => Order[];
  addInventory: (storeId: string, item: NewInventory, original?: ProductAIExtraction, corrected?: ProductAIExtraction) => Promise<string>;
  addInventoryBulk: (storeId: string, items: Array<{ name: string; category: string; quantity: number; price?: number }>) => Promise<number>;
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void;
  publishItem: (id: string) => void;
  saveListing: (inventoryItemId: string, draft: ListingDraft) => Promise<{ ok: boolean; message: string }>;
  addToCart: (listingId: string) => void;
  removeFromCart: (listingId: string) => void;
  setCartQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (customer: Checkout) => Promise<string[]>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<{ ok: boolean; message?: string }>;
  approveWorkflowExecution: (executionId: string) => Promise<{ ok: boolean; message: string }>;
  updateBusiness: (storeId: string, patch: Partial<Business>) => void;
  resetDemo: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);
const CART_KEY = "scanmart_cart_v1";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const EMPTY_STATE: AppState = {
  company: { id: "", name: "" },
  stores: [],
  inventory: [],
  listings: [],
  orders: [],
  workflows: [],
  executions: [],
  corrections: [],
  cart: [],
};

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      if (typeof body.detail === "string") detail = body.detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res;
}

// Fetch all 5 per-store resources in parallel — the hot path for a single store.
async function fetchStoreData(storeId: string): Promise<{
  inventory: InventoryItem[];
  listings: ProductListing[];
  orders: Order[];
  workflows: Workflow[];
  executions: WorkflowExecution[];
}> {
  const [inventory, listings, orders, workflows, executions] = await Promise.all([
    apiFetch(`/stores/${storeId}/inventory`).then(r => r.json()) as Promise<InventoryItem[]>,
    apiFetch(`/stores/${storeId}/listings`).then(r => r.json()) as Promise<ProductListing[]>,
    apiFetch(`/stores/${storeId}/orders`).then(r => r.json()) as Promise<Order[]>,
    apiFetch(`/stores/${storeId}/workflows`).then(r => r.json()) as Promise<Workflow[]>,
    apiFetch(`/stores/${storeId}/executions`).then(r => r.json()) as Promise<WorkflowExecution[]>,
  ]);
  return { inventory, listings, orders, workflows, executions };
}

// Merge a freshly-fetched store's data into existing state, replacing the old slice.
function mergeStoreData(
  current: AppState,
  storeId: string,
  data: Awaited<ReturnType<typeof fetchStoreData>>,
): AppState {
  return {
    ...current,
    inventory: [...current.inventory.filter(i => i.businessId !== storeId), ...data.inventory],
    listings: [...current.listings.filter(l => l.businessId !== storeId), ...data.listings],
    orders: [...current.orders.filter(o => o.businessId !== storeId), ...data.orders],
    workflows: [...current.workflows.filter(w => w.businessId !== storeId), ...data.workflows],
    executions: [
      ...current.executions.filter(e => {
        const wf = current.workflows.find(w => w.id === e.workflowId);
        return wf?.businessId !== storeId;
      }),
      ...data.executions,
    ],
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [storeDataLoading, setStoreDataLoading] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const pathname = usePathname();

  // Capture the admin storeId that was in the URL at the time this provider first mounted.
  // useState initializer runs exactly once — subsequent pathname changes don't affect this.
  const [initialAdminStoreId] = useState<string | null>(
    () => pathname?.match(/^\/admin\/([^/]+)/)?.[1] ?? null,
  );

  // Which stores have had their per-store data successfully fetched.
  // A ref (not state) so reads inside effects never go stale without triggering re-renders.
  const loadedStoreIdsRef = useRef<Set<string>>(new Set());

  // ─── Cart: load from localStorage on mount, persist on change ─────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setState(s => ({ ...s, cart: (JSON.parse(saved) as { cart: CartItem[] }).cart ?? [] }));
    } catch { /* start clean */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify({ cart: state.cart }));
  }, [hydrated, state.cart]);

  // ─── Initial load ──────────────────────────────────────────────────────────
  // Strategy: always fetch company + stores list (2 fast requests).
  // If the app opened on an admin path, also fetch that one store's data in the
  // same loading phase (5 parallel requests) so the dashboard renders immediately.
  // All other stores are loaded lazily on demand via the effect below.
  useEffect(() => {
    let cancelled = false;
    loadedStoreIdsRef.current.clear(); // reset cache on every full reload
    setApiLoading(true);
    setApiError(null);

    const load = async () => {
      try {
        const [company, stores] = await Promise.all([
          apiFetch("/company").then(r => r.json()) as Promise<Company>,
          apiFetch("/stores").then(r => r.json()) as Promise<Business[]>,
        ]);
        if (cancelled) return;

        // If the user landed directly on an admin page, prefetch that store so
        // it's ready when the loading screen lifts — no blank inventory flash.
        let prefetched: Awaited<ReturnType<typeof fetchStoreData>> | null = null;
        if (initialAdminStoreId && stores.some(s => s.id === initialAdminStoreId)) {
          loadedStoreIdsRef.current.add(initialAdminStoreId); // mark before await to block lazy-load
          prefetched = await fetchStoreData(initialAdminStoreId);
        }
        if (cancelled) return;

        setState(current => ({
          ...current,
          company,
          stores,
          inventory: prefetched?.inventory ?? [],
          listings: prefetched?.listings ?? [],
          orders: prefetched?.orders ?? [],
          workflows: prefetched?.workflows ?? [],
          executions: prefetched?.executions ?? [],
          corrections: [],
        }));
        setApiError(null);
      } catch (err) {
        if (!cancelled) setApiError(err instanceof Error ? err.message : "Failed to connect to backend");
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [loadKey, initialAdminStoreId]);

  // ─── Lazy per-store load ────────────────────────────────────────────────────
  // Fires when the admin layout calls setCurrentStoreId(storeId). Skips if the
  // store's data is already cached. This is what makes same-store navigation instant.
  useEffect(() => {
    if (!currentStoreId) return;
    if (loadedStoreIdsRef.current.has(currentStoreId)) return;

    // Claim the slot immediately to prevent a duplicate fetch from a rapid re-render.
    loadedStoreIdsRef.current.add(currentStoreId);
    setStoreDataLoading(true);

    let cancelled = false;
    fetchStoreData(currentStoreId)
      .then(data => {
        if (cancelled) return;
        setState(current => mergeStoreData(current, currentStoreId, data));
      })
      .catch(() => {
        // Release the slot so a retry (e.g., user revisits the store) will try again.
        loadedStoreIdsRef.current.delete(currentStoreId);
      })
      .finally(() => { if (!cancelled) setStoreDataLoading(false); });

    return () => { cancelled = true; };
  }, [currentStoreId]);

  // ─── Load all stores for shop pages ───────────────────────────────────────
  // Fetches every store not yet in loadedStoreIdsRef in parallel — used by the
  // shop index and individual store pages so customers don't see zero products.
  const loadAllStores = useCallback(async () => {
    const unloaded = state.stores.filter(s => !loadedStoreIdsRef.current.has(s.id));
    if (unloaded.length === 0) return;
    // Claim all slots up front to prevent duplicate fetches from rapid re-renders.
    for (const s of unloaded) loadedStoreIdsRef.current.add(s.id);
    setStoreDataLoading(true);
    try {
      const settled = await Promise.all(
        unloaded.map(async s => {
          try {
            return { storeId: s.id, data: await fetchStoreData(s.id) };
          } catch {
            loadedStoreIdsRef.current.delete(s.id); // allow retry on failure
            return null;
          }
        }),
      );
      setState(current => {
        let next = current;
        for (const r of settled) {
          if (r) next = mergeStoreData(next, r.storeId, r.data);
        }
        return next;
      });
    } finally {
      setStoreDataLoading(false);
    }
  }, [state.stores]);

  // ─── Store refresh helpers ─────────────────────────────────────────────────
  const refreshStoreInventory = useCallback(async (storeId: string) => {
    const inventory = await apiFetch(`/stores/${storeId}/inventory`).then(r => r.json()) as InventoryItem[];
    setState(current => ({
      ...current,
      inventory: [...current.inventory.filter(i => i.businessId !== storeId), ...inventory],
    }));
  }, []);

  const refreshStoreListingsAndExecutions = useCallback(async (storeId: string) => {
    const [listings, executions] = await Promise.all([
      apiFetch(`/stores/${storeId}/listings`).then(r => r.json()) as Promise<ProductListing[]>,
      apiFetch(`/stores/${storeId}/executions`).then(r => r.json()) as Promise<WorkflowExecution[]>,
    ]);
    setState(current => ({
      ...current,
      listings: [...current.listings.filter(l => l.businessId !== storeId), ...listings],
      executions: [
        ...current.executions.filter(e => {
          const wf = current.workflows.find(w => w.id === e.workflowId);
          return wf?.businessId !== storeId;
        }),
        ...executions,
      ],
    }));
  }, []);

  // Refreshes inventory + orders + executions (used after order accept)
  const refreshStoreOrders = useCallback(async (storeId: string) => {
    const [inventory, orders, executions] = await Promise.all([
      apiFetch(`/stores/${storeId}/inventory`).then(r => r.json()) as Promise<InventoryItem[]>,
      apiFetch(`/stores/${storeId}/orders`).then(r => r.json()) as Promise<Order[]>,
      apiFetch(`/stores/${storeId}/executions`).then(r => r.json()) as Promise<WorkflowExecution[]>,
    ]);
    setState(current => ({
      ...current,
      inventory: [...current.inventory.filter(i => i.businessId !== storeId), ...inventory],
      orders: [...current.orders.filter(o => o.businessId !== storeId), ...orders],
      executions: [
        ...current.executions.filter(e => {
          const wf = current.workflows.find(w => w.id === e.workflowId);
          return wf?.businessId !== storeId;
        }),
        ...executions,
      ],
    }));
  }, []);

  // ─── Read helpers ──────────────────────────────────────────────────────────
  const getStore = useCallback((id: string) => state.stores.find(s => s.id === id), [state.stores]);
  const getStoreInventory = useCallback((id: string) => state.inventory.filter(item => item.businessId === id), [state.inventory]);
  const getStoreListings = useCallback((id: string) => state.listings.filter(l => l.businessId === id), [state.listings]);
  const getStoreOrders = useCallback((id: string) => state.orders.filter(o => o.businessId === id), [state.orders]);

  // ─── Inventory mutations ───────────────────────────────────────────────────
  const addInventory = useCallback(async (
    storeId: string,
    item: NewInventory,
    original?: ProductAIExtraction,
    corrected?: ProductAIExtraction,
  ): Promise<string> => {
    const newItem = await apiFetch(`/stores/${storeId}/inventory`, {
      method: "POST",
      body: JSON.stringify({
        name: item.name,
        brand: item.brand,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        lowStockThreshold: item.lowStockThreshold,
        price: item.price,
        imageUrl: item.imageUrl,
        source: item.source,
        aiConfidence: item.aiConfidence,
        status: item.status,
        original: original ?? null,
        corrected: corrected ?? null,
      }),
    }).then(r => r.json()) as InventoryItem;

    // Refresh: new draft listing + workflow execution created server-side for ai_scan
    await Promise.all([
      refreshStoreInventory(storeId),
      refreshStoreListingsAndExecutions(storeId),
    ]);

    return newItem.id;
  }, [refreshStoreInventory, refreshStoreListingsAndExecutions]);

  const addInventoryBulk = useCallback(async (
    storeId: string,
    items: Array<{ name: string; category: string; quantity: number; price?: number }>,
  ): Promise<number> => {
    if (items.length === 0) return 0;
    const threshold = state.stores.find(s => s.id === storeId)?.lowStockThreshold ?? 3;
    let added = 0;
    for (const item of items) {
      try {
        await apiFetch(`/stores/${storeId}/inventory`, {
          method: "POST",
          body: JSON.stringify({
            name: item.name,
            category: item.category,
            description: "",
            quantity: item.quantity,
            unit: "pcs",
            lowStockThreshold: threshold,
            price: item.price,
            source: "receipt",
            status: "active",
          }),
        });
        added++;
      } catch { /* skip failed items */ }
    }
    if (added > 0) await refreshStoreInventory(storeId);
    return added;
  }, [state.stores, refreshStoreInventory]);

  const updateInventory = useCallback(async (id: string, patch: Partial<InventoryItem>): Promise<void> => {
    const updated = await apiFetch(`/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).then(r => r.json()) as InventoryItem;
    setState(current => ({
      ...current,
      inventory: current.inventory.map(i => i.id === id ? updated : i),
    }));
  }, []);

  const publishItem = useCallback(async (id: string): Promise<void> => {
    const item = state.inventory.find(i => i.id === id);
    if (!item?.price) return;
    const listing = state.listings.find(l => l.inventoryItemId === id);
    if (!listing) return;
    const updated = await apiFetch(`/listings/${listing.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: listing.title || item.name,
        description: listing.description || item.description,
        price: item.price,
        isPublished: true,
      }),
    }).then(r => r.json()) as ProductListing;
    setState(current => ({
      ...current,
      listings: current.listings.map(l => l.id === listing.id ? updated : l),
    }));
  }, [state.inventory, state.listings]);

  const saveListing = useCallback(async (inventoryItemId: string, draft: ListingDraft): Promise<{ ok: boolean; message: string }> => {
    const title = draft.title.trim();
    const description = draft.description.trim();
    if (!title || !description || !Number.isFinite(draft.price) || draft.price <= 0) {
      return { ok: false, message: "Add a title, description, and valid price." };
    }
    const listing = state.listings.find(l => l.inventoryItemId === inventoryItemId);
    if (!listing) return { ok: false, message: "Listing not found." };
    try {
      const [updatedListing, updatedItem] = await Promise.all([
        apiFetch(`/listings/${listing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, description, price: draft.price, isPublished: true }),
        }).then(r => r.json()) as Promise<ProductListing>,
        apiFetch(`/inventory/${inventoryItemId}`, {
          method: "PATCH",
          body: JSON.stringify({ name: title, description, price: draft.price }),
        }).then(r => r.json()) as Promise<InventoryItem>,
      ]);
      setState(current => ({
        ...current,
        listings: current.listings.map(l => l.id === listing.id ? updatedListing : l),
        inventory: current.inventory.map(i => i.id === inventoryItemId ? updatedItem : i),
      }));
      return { ok: true, message: "Storefront listing updated." };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Failed to save listing." };
    }
  }, [state.listings]);

  // ─── Cart mutations (local only) ───────────────────────────────────────────
  const addToCart = useCallback((listingId: string) => {
    setState(current => {
      const listing = current.listings.find(l => l.id === listingId);
      if (!listing) return current;
      const store = current.stores.find(s => s.id === listing.businessId);
      const invItem = current.inventory.find(i => i.id === listing.inventoryItemId);
      if (!store || !invItem) return current;
      const existing = current.cart.find(c => c.listingId === listingId);
      if (existing) {
        return { ...current, cart: current.cart.map(c => c.listingId === listingId ? { ...c, quantity: c.quantity + 1 } : c) };
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
    setState(current => ({ ...current, cart: current.cart.filter(c => c.listingId !== listingId) }));
  }, []);

  const setCartQuantity = useCallback((listingId: string, quantity: number) => {
    setState(current => ({
      ...current,
      cart: quantity <= 0
        ? current.cart.filter(item => item.listingId !== listingId)
        : current.cart.map(item => item.listingId === listingId ? { ...item, quantity } : item),
    }));
  }, []);

  const clearCart = useCallback(() => setState(current => ({ ...current, cart: [] })), []);

  // ─── Order mutations ────────────────────────────────────────────────────────
  const placeOrder = useCallback(async (customer: Checkout): Promise<string[]> => {
    if (state.cart.length === 0) return [];
    const result = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({
        cart: state.cart.map(item => ({
          storeId: item.storeId,
          listingId: item.listingId,
          inventoryItemId: item.inventoryItemId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
        customerEmail: customer.customerEmail,
      }),
    }).then(r => r.json()) as { orderIds: string[] };

    const storeIds = [...new Set(state.cart.map(i => i.storeId))];
    // Refresh orders first so the confirmation page can find the new order in state,
    // then clear the cart — this prevents a re-render flash of "Your cart is empty"
    // while the caller is still awaiting the post-navigation cleanup.
    await Promise.all(storeIds.map(sid => refreshStoreOrders(sid)));
    setState(current => ({ ...current, cart: [] }));

    return result.orderIds;
  }, [state.cart, refreshStoreOrders]);

  const updateOrderStatus = useCallback(async (id: string, status: Order["status"]): Promise<{ ok: boolean; message?: string }> => {
    try {
      const updated = await apiFetch(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }).then(r => r.json()) as Order;

      if (status === "accepted") {
        // Refresh inventory + orders + executions (stock reduced, new execution created)
        await refreshStoreOrders(updated.businessId);
      } else {
        setState(current => ({
          ...current,
          orders: current.orders.map(o => o.id === id ? updated : o),
        }));
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Could not update order." };
    }
  }, [refreshStoreOrders]);

  // ─── Workflow mutations ─────────────────────────────────────────────────────
  const approveWorkflowExecution = useCallback(async (executionId: string): Promise<{ ok: boolean; message: string }> => {
    const execution = state.executions.find(e => e.id === executionId);
    const workflow = state.workflows.find(w => w.id === execution?.workflowId);
    const storeId = workflow?.businessId;
    try {
      const result = await apiFetch(`/executions/${executionId}/approve`, {
        method: "PATCH",
      }).then(r => r.json()) as { ok: boolean; message: string };
      if (storeId) await refreshStoreListingsAndExecutions(storeId);
      return result;
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Could not approve execution." };
    }
  }, [state.executions, state.workflows, refreshStoreListingsAndExecutions]);

  // ─── Business mutations ─────────────────────────────────────────────────────
  // No backend endpoint for store updates yet — local only (not persisted across sessions)
  const updateBusiness = useCallback((storeId: string, patch: Partial<Business>) => {
    setState(current => ({
      ...current,
      stores: current.stores.map(s => s.id === storeId ? { ...s, ...patch } : s),
    }));
  }, []);

  // Calls the backend reset endpoint, then clears the cache and re-fetches all data.
  const resetDemo = useCallback(async () => {
    await apiFetch("/reset", { method: "POST" });
    loadedStoreIdsRef.current.clear();
    setLoadKey(k => k + 1);
  }, []);

  // ─── Context value ──────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    state,
    hydrated: !apiLoading && apiError === null,
    storeDataLoading,
    currentStoreId,
    setCurrentStoreId,
    loadAllStores,
    getStore, getStoreInventory, getStoreListings, getStoreOrders,
    addInventory, addInventoryBulk, updateInventory, publishItem, saveListing,
    addToCart, removeFromCart, setCartQuantity, clearCart,
    placeOrder, updateOrderStatus, approveWorkflowExecution,
    updateBusiness, resetDemo,
  }), [
    state, apiLoading, apiError, storeDataLoading, currentStoreId,
    loadAllStores,
    getStore, getStoreInventory, getStoreListings, getStoreOrders,
    addInventory, addInventoryBulk, updateInventory, publishItem, saveListing,
    addToCart, removeFromCart, setCartQuantity, clearCart,
    placeOrder, updateOrderStatus, approveWorkflowExecution,
    updateBusiness, resetDemo,
  ]);

  if (apiLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid var(--line)", borderTopColor: "var(--brand)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Connecting to backend…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (apiError) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "var(--canvas)", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <h2 style={{ color: "var(--ink)", marginBottom: 8 }}>Could not connect to backend</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>{apiError}</p>
          <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 24 }}>
            Make sure the API is running at <code>{API_BASE}</code>
            <br />(controlled by <code>NEXT_PUBLIC_API_URL</code>)
          </p>
          <button className="btn btn-primary" onClick={() => setLoadKey(k => k + 1)}>
            Retry connection
          </button>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
