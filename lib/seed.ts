import type { AppState } from "@/types";

const now = new Date().toISOString();

export const templates = {
  salon: ["Haircare", "Styling", "Shaving", "Skincare", "Tools", "Cleaning"],
  cafe: ["Coffee", "Milk", "Bakery", "Syrups", "Packaging", "Cleaning"],
  grocery: ["Snacks", "Beverages", "Personal Care", "Cleaning", "Staples", "Dairy"],
};

export const initialState: AppState = {
  business: {
    id: "biz_demo",
    name: "Urban Glow Salon",
    slug: "urban-glow",
    businessType: "salon",
    lowStockThreshold: 3,
  },
  inventory: [
    { id: "inv_1", businessId: "biz_demo", name: "Dove Intense Repair Shampoo", brand: "Dove", category: "Haircare", description: "Nourishing shampoo for damaged hair.", quantity: 12, unit: "pcs", lowStockThreshold: 3, price: 349, source: "ai_scan", aiConfidence: 0.94, status: "active", createdAt: now },
    { id: "inv_2", businessId: "biz_demo", name: "Matte Finish Hair Wax", category: "Styling", description: "Strong hold with a clean matte finish.", quantity: 2, unit: "pcs", lowStockThreshold: 3, price: 299, source: "manual", status: "active", createdAt: now },
    { id: "inv_3", businessId: "biz_demo", name: "Professional Razor Blades", category: "Shaving", description: "Stainless steel replacement blades.", quantity: 24, unit: "packs", lowStockThreshold: 5, price: 180, source: "import", status: "active", createdAt: now },
    { id: "inv_4", businessId: "biz_demo", name: "Argan Hair Serum", category: "Haircare", description: "Lightweight finishing serum for shine.", quantity: 8, unit: "pcs", lowStockThreshold: 3, price: 449, source: "ai_scan", aiConfidence: 0.89, status: "active", createdAt: now },
  ],
  listings: [
    { id: "list_1", businessId: "biz_demo", inventoryItemId: "inv_1", title: "Dove Intense Repair Shampoo", description: "Nourishing shampoo for damaged hair.", price: 349, isPublished: true },
    { id: "list_2", businessId: "biz_demo", inventoryItemId: "inv_2", title: "Matte Finish Hair Wax", description: "Strong hold with a clean matte finish.", price: 299, isPublished: true },
    { id: "list_4", businessId: "biz_demo", inventoryItemId: "inv_4", title: "Argan Hair Serum", description: "Lightweight finishing serum for shine.", price: 449, isPublished: true },
  ],
  orders: [],
  workflows: [
    { id: "wf_scan", businessId: "biz_demo", name: "Create draft listing from scanned product", triggerType: "PRODUCT_SCANNED", description: "Turns a confirmed scan into a reviewable storefront draft.", isActive: true, nodeNames: ["Generate product description", "Create draft listing", "Request human approval"] },
    { id: "wf_order", businessId: "biz_demo", name: "Reduce stock when order is accepted", triggerType: "ORDER_ACCEPTED", description: "Updates inventory and checks stock health after a sale.", isActive: true, nodeNames: ["Reduce stock", "Check low stock", "Send in-app notification"] },
    { id: "wf_low", businessId: "biz_demo", name: "Low stock reorder reminder", triggerType: "LOW_STOCK_DETECTED", description: "Creates a seller task when an item needs replenishment.", isActive: true, nodeNames: ["Create seller task", "Send in-app notification"] },
  ],
  executions: [
    {
      id: "exec_demo",
      workflowId: "wf_scan",
      status: "waiting_for_human",
      trigger: "PRODUCT_SCANNED",
      startedAt: now,
      nodes: [
        { id: "node_1", nodeName: "AI generated product description", nodeType: "GENERATE_PRODUCT_DESCRIPTION", status: "success", input: { inventoryItemId: "inv_4" }, output: { description: "Lightweight finishing serum for shine." }, timestamp: now },
        { id: "node_2", nodeName: "Draft listing created", nodeType: "CREATE_DRAFT_LISTING", status: "success", input: { inventoryItemId: "inv_4" }, output: { listingId: "list_4" }, timestamp: now },
        { id: "node_3", nodeName: "Waiting for seller approval", nodeType: "REQUEST_HUMAN_APPROVAL", status: "waiting_for_human", input: { listingId: "list_4" }, timestamp: now },
      ],
    },
  ],
  corrections: [],
  cart: [],
};
