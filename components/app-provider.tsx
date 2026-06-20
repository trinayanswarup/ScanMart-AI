"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { initialState } from "@/lib/seed";
import type { AppState, Business, InventoryItem, Order, ProductAIExtraction } from "@/types";

type NewInventory = Omit<InventoryItem, "id" | "businessId" | "createdAt">;
type Checkout = { customerName: string; customerPhone?: string; customerEmail?: string };

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  addInventory: (item: NewInventory, original?: ProductAIExtraction, corrected?: ProductAIExtraction) => string;
  updateInventory: (id: string, patch: Partial<InventoryItem>) => void;
  publishItem: (id: string) => void;
  addToCart: (listingId: string) => void;
  setCartQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (customer: Checkout) => string;
  updateOrderStatus: (id: string, status: Order["status"]) => { ok: boolean; message?: string };
  approveWorkflowExecution: (executionId: string) => { ok: boolean; message: string };
  updateBusiness: (business: Partial<Business>) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = "scanmart_demo_v1";
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setState(JSON.parse(saved) as AppState);
    } catch { /* start clean if browser data is invalid */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const addInventory = useCallback((item: NewInventory, original?: ProductAIExtraction, corrected?: ProductAIExtraction) => {
    const id = makeId("inv");
    const inventoryItem: InventoryItem = { ...item, id, businessId: state.business.id, createdAt: new Date().toISOString() };
    setState((current) => {
      const workflow = current.workflows.find((entry) => entry.triggerType === "PRODUCT_SCANNED");
      const listingId = makeId("list");
      const executionId = makeId("exec");
      return {
        ...current,
        inventory: [inventoryItem, ...current.inventory],
        listings: item.source === "ai_scan" ? [{ id: listingId, businessId: current.business.id, inventoryItemId: id, title: item.name, description: item.description, price: item.price ?? 0, isPublished: false }, ...current.listings] : current.listings,
        corrections: original && corrected && JSON.stringify(original) !== JSON.stringify(corrected)
          ? [{ id: makeId("correction"), inventoryItemId: id, original, corrected, createdAt: new Date().toISOString() }, ...current.corrections]
          : current.corrections,
        executions: workflow ? [{
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
        }, ...current.executions] : current.executions,
      };
    });
    return id;
  }, [state.business.id]);

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
        : [{ id: makeId("list"), businessId: current.business.id, inventoryItemId: id, title: item.name, description: item.description, price: item.price, imageUrl: item.imageUrl, isPublished: true }, ...current.listings];
      return { ...current, listings };
    });
  }, []);

  const addToCart = useCallback((listingId: string) => {
    setState((current) => {
      const exists = current.cart.find((item) => item.listingId === listingId);
      return { ...current, cart: exists ? current.cart.map((item) => item.listingId === listingId ? { ...item, quantity: item.quantity + 1 } : item) : [...current.cart, { listingId, quantity: 1 }] };
    });
  }, []);

  const setCartQuantity = useCallback((listingId: string, quantity: number) => {
    setState((current) => ({ ...current, cart: quantity <= 0 ? current.cart.filter((item) => item.listingId !== listingId) : current.cart.map((item) => item.listingId === listingId ? { ...item, quantity } : item) }));
  }, []);

  const clearCart = useCallback(() => setState((current) => ({ ...current, cart: [] })), []);

  const placeOrder = useCallback((customer: Checkout) => {
    const id = makeId("order");
    setState((current) => {
      const items = current.cart.flatMap((cartItem) => {
        const listing = current.listings.find((entry) => entry.id === cartItem.listingId);
        if (!listing) return [];
        return [{ id: makeId("orderitem"), listingId: listing.id, inventoryItemId: listing.inventoryItemId, name: listing.title, quantity: cartItem.quantity, unitPrice: listing.price, lineTotal: listing.price * cartItem.quantity }];
      });
      const order: Order = { id, businessId: current.business.id, ...customer, status: "new", totalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0), items, createdAt: new Date().toISOString(), stockReduced: false };
      return { ...current, orders: [order, ...current.orders], cart: [] };
    });
    return id;
  }, []);

  const updateOrderStatus = useCallback((id: string, status: Order["status"]) => {
    let response = { ok: true } as { ok: boolean; message?: string };
    setState((current) => {
      const order = current.orders.find((entry) => entry.id === id);
      if (!order) { response = { ok: false, message: "Order not found." }; return current; }
      if (status !== "accepted" || order.stockReduced) return { ...current, orders: current.orders.map((entry) => entry.id === id ? { ...entry, status } : entry) };
      const unavailable = order.items.find((orderItem) => (current.inventory.find((item) => item.id === orderItem.inventoryItemId)?.quantity ?? 0) < orderItem.quantity);
      if (unavailable) { response = { ok: false, message: `${unavailable.name} does not have enough stock.` }; return current; }
      const inventory = current.inventory.map((item) => {
        const ordered = order.items.find((entry) => entry.inventoryItemId === item.id);
        return ordered ? { ...item, quantity: item.quantity - ordered.quantity } : item;
      });
      const lowStock = inventory.filter((item) => order.items.some((entry) => entry.inventoryItemId === item.id) && item.quantity <= item.lowStockThreshold);
      const workflow = current.workflows.find((entry) => entry.triggerType === "ORDER_ACCEPTED");
      const execution = workflow ? {
        id: makeId("exec"), workflowId: workflow.id, status: "success" as const, trigger: "ORDER_ACCEPTED", startedAt: new Date().toISOString(),
        nodes: [
          { id: makeId("node"), nodeName: "Stock reduced", nodeType: "REDUCE_STOCK", status: "success" as const, input: { orderId: id }, output: { itemsUpdated: order.items.length }, timestamp: new Date().toISOString() },
          { id: makeId("node"), nodeName: "Low stock checked", nodeType: "CHECK_LOW_STOCK", status: "success" as const, input: { orderId: id }, output: { lowStockItems: lowStock.map((item) => item.name) }, timestamp: new Date().toISOString() },
          { id: makeId("node"), nodeName: "Seller notified", nodeType: "SEND_IN_APP_NOTIFICATION", status: "success" as const, input: { orderId: id }, output: { message: lowStock.length ? `${lowStock.length} item(s) need attention` : "Stock levels look healthy" }, timestamp: new Date().toISOString() },
        ],
      } : null;
      return { ...current, inventory, orders: current.orders.map((entry) => entry.id === id ? { ...entry, status, stockReduced: true } : entry), executions: execution ? [execution, ...current.executions] : current.executions };
    });
    return response;
  }, []);

  const approveWorkflowExecution = useCallback((executionId: string) => {
    const execution = state.executions.find((entry) => entry.id === executionId);
    if (!execution) return { ok: false, message: "Execution not found." };
    if (execution.status !== "waiting_for_human") return { ok: false, message: "This execution is not waiting for approval." };

    const approvalNode = execution.nodes.find((node) => node.status === "waiting_for_human");
    const listingId = typeof approvalNode?.input.listingId === "string" ? approvalNode.input.listingId : undefined;
    const listing = state.listings.find((entry) => entry.id === listingId);
    if (!approvalNode || !listing) return { ok: false, message: "The draft listing linked to this approval could not be found." };
    if (listing.price <= 0) return { ok: false, message: "Set a product price before approving this listing." };

    const approvedAt = new Date().toISOString();
    setState((current) => ({
      ...current,
      listings: current.listings.map((entry) => entry.id === listing.id ? { ...entry, isPublished: true } : entry),
      executions: current.executions.map((entry) => entry.id === executionId ? {
        ...entry,
        status: "success",
        nodes: entry.nodes.map((node) => node.id === approvalNode.id ? {
          ...node,
          nodeName: "Seller approved and published listing",
          status: "success",
          output: { listingId: listing.id, published: true, approvedAt },
          timestamp: approvedAt,
        } : node),
      } : entry),
    }));
    return { ok: true, message: "Listing approved, published, and workflow completed." };
  }, [state.executions, state.listings]);
  const updateBusiness = useCallback((business: Partial<Business>) => setState((current) => ({ ...current, business: { ...current.business, ...business } })), []);
  const resetDemo = useCallback(() => setState(structuredClone(initialState)), []);

  const value = useMemo(() => ({ state, hydrated, addInventory, updateInventory, publishItem, addToCart, setCartQuantity, clearCart, placeOrder, updateOrderStatus, approveWorkflowExecution, updateBusiness, resetDemo }), [state, hydrated, addInventory, updateInventory, publishItem, addToCart, setCartQuantity, clearCart, placeOrder, updateOrderStatus, approveWorkflowExecution, updateBusiness, resetDemo]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

