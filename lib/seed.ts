import type { AppState, BusinessType } from "@/types";

const now = new Date().toISOString();
const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

export const initialState: AppState = {
  company: { id: "co_01", name: "ScanMart" },
  stores: [
    { id: "biz_salon_01", name: "Urban Glow Salon", slug: "urban-glow", businessType: "salon", lowStockThreshold: 3 },
    { id: "biz_cafe_01", name: "Corner Café", slug: "corner-cafe", businessType: "cafe", lowStockThreshold: 5 },
    { id: "biz_grocery_01", name: "FreshMart Grocery", slug: "freshmart", businessType: "grocery", lowStockThreshold: 10 },
  ],
  inventory: [
    // — Urban Glow Salon ————————————————————————————————————————————————————————
    { id: "inv_1", businessId: "biz_salon_01", name: "Dove Intense Repair Shampoo", brand: "Dove", category: "Haircare", description: "Nourishing shampoo for damaged hair.", quantity: 12, unit: "pcs", lowStockThreshold: 3, price: 349, source: "ai_scan", aiConfidence: 0.94, status: "active", createdAt: now },
    { id: "inv_2", businessId: "biz_salon_01", name: "Matte Finish Hair Wax", category: "Styling", description: "Strong hold with a clean matte finish.", quantity: 2, unit: "pcs", lowStockThreshold: 3, price: 299, source: "manual", status: "active", createdAt: now },
    { id: "inv_3", businessId: "biz_salon_01", name: "Professional Razor Blades", category: "Shaving", description: "Stainless steel replacement blades.", quantity: 24, unit: "packs", lowStockThreshold: 5, price: 180, source: "import", status: "active", createdAt: now },
    { id: "inv_4", businessId: "biz_salon_01", name: "Argan Hair Serum", category: "Haircare", description: "Lightweight finishing serum for shine.", quantity: 8, unit: "pcs", lowStockThreshold: 3, price: 449, source: "ai_scan", aiConfidence: 0.89, status: "active", createdAt: now },
    // — Corner Café —————————————————————————————————————————————————————————————
    { id: "inv_cafe_01", businessId: "biz_cafe_01", name: "Ethiopian Arabica Coffee Beans", brand: "Devoção", category: "Coffee", description: "Single-origin Ethiopian Arabica beans with natural fruit notes. Medium roast, ideal for espresso and pour-over.", quantity: 15, unit: "kg", lowStockThreshold: 5, price: 1200, source: "ai_scan", aiConfidence: 0.91, status: "active", createdAt: d(5) },
    { id: "inv_cafe_02", businessId: "biz_cafe_01", name: "Oat Milk 1L", brand: "Oatly", category: "Milk", description: "Barista-grade oat milk for lattes and cappuccinos. Froths perfectly.", quantity: 4, unit: "packs", lowStockThreshold: 5, price: 220, source: "manual", status: "active", createdAt: d(3) },
    { id: "inv_cafe_03", businessId: "biz_cafe_01", name: "Butter Croissants", category: "Bakery", description: "Freshly baked all-butter croissants. Sourced daily from local bakery.", quantity: 12, unit: "pcs", lowStockThreshold: 5, price: 85, source: "manual", status: "active", createdAt: d(1) },
    { id: "inv_cafe_04", businessId: "biz_cafe_01", name: "Paper Cups 350ml", brand: "Huhtamaki", category: "Packaging", description: "Eco-friendly double-wall paper cups. Suitable for hot beverages up to 85°C.", quantity: 500, unit: "pcs", lowStockThreshold: 50, price: 3, source: "import", status: "active", createdAt: d(10) },
    // — FreshMart Grocery ———————————————————————————————————————————————————————
    { id: "inv_gro_01", businessId: "biz_grocery_01", name: "Parle-G Biscuits 800g", brand: "Parle", category: "Snacks", description: "Classic glucose biscuits. India's most loved biscuit brand.", quantity: 60, unit: "packs", lowStockThreshold: 10, price: 50, source: "ai_scan", aiConfidence: 0.96, status: "active", createdAt: d(7) },
    { id: "inv_gro_02", businessId: "biz_grocery_01", name: "Amul Butter 500g", brand: "Amul", category: "Dairy", description: "Pasteurised table butter. Perfect for cooking and spreading.", quantity: 8, unit: "packs", lowStockThreshold: 10, price: 275, source: "ai_scan", aiConfidence: 0.88, status: "active", createdAt: d(4) },
    { id: "inv_gro_03", businessId: "biz_grocery_01", name: "Tata Salt 1kg", brand: "Tata", category: "Staples", description: "Iodised vacuum evaporated salt for everyday use.", quantity: 35, unit: "packs", lowStockThreshold: 10, price: 28, source: "import", status: "active", createdAt: d(10) },
    { id: "inv_gro_04", businessId: "biz_grocery_01", name: "Haldiram's Aloo Bhujia 400g", brand: "Haldiram's", category: "Snacks", description: "Crispy spiced potato noodle snack. Popular across all age groups.", quantity: 22, unit: "packs", lowStockThreshold: 10, price: 95, source: "manual", status: "active", createdAt: d(2) },
  ],
  listings: [
    // — Urban Glow Salon ————————————————————————————————————————————————————————
    { id: "list_1", businessId: "biz_salon_01", inventoryItemId: "inv_1", title: "Dove Intense Repair Shampoo", description: "Nourishing shampoo for damaged hair.", price: 349, isPublished: true },
    { id: "list_2", businessId: "biz_salon_01", inventoryItemId: "inv_2", title: "Matte Finish Hair Wax", description: "Strong hold with a clean matte finish.", price: 299, isPublished: true },
    { id: "list_4", businessId: "biz_salon_01", inventoryItemId: "inv_4", title: "Argan Hair Serum", description: "Lightweight finishing serum for shine.", price: 449, isPublished: false },
    // — Corner Café —————————————————————————————————————————————————————————————
    { id: "list_cafe_01", businessId: "biz_cafe_01", inventoryItemId: "inv_cafe_01", title: "Ethiopian Arabica Coffee Beans", description: "Single-origin Ethiopian Arabica beans with natural fruit notes. Medium roast.", price: 1200, isPublished: true },
    { id: "list_cafe_02", businessId: "biz_cafe_01", inventoryItemId: "inv_cafe_02", title: "Oatly Oat Milk 1L", description: "Barista-grade oat milk. Froths perfectly for lattes.", price: 220, isPublished: false },
    { id: "list_cafe_03", businessId: "biz_cafe_01", inventoryItemId: "inv_cafe_03", title: "Freshly Baked Butter Croissants", description: "All-butter croissants sourced from local bakery.", price: 85, isPublished: true },
    // — FreshMart Grocery ———————————————————————————————————————————————————————
    { id: "list_gro_01", businessId: "biz_grocery_01", inventoryItemId: "inv_gro_01", title: "Parle-G Biscuits 800g", description: "Classic glucose biscuits. India's most loved biscuit brand.", price: 50, isPublished: true },
    { id: "list_gro_02", businessId: "biz_grocery_01", inventoryItemId: "inv_gro_03", title: "Tata Salt 1kg", description: "Iodised vacuum evaporated salt.", price: 28, isPublished: true },
    { id: "list_gro_04", businessId: "biz_grocery_01", inventoryItemId: "inv_gro_04", title: "Haldiram's Aloo Bhujia 400g", description: "Crispy spiced potato noodle snack.", price: 95, isPublished: false },
  ],
  orders: [
    // — Corner Café —————————————————————————————————————————————————————————————
    {
      id: "ord_cafe_01", businessId: "biz_cafe_01", customerName: "Priya Mehta", customerPhone: "+91 9876543210",
      status: "completed", totalAmount: 1370, stockReduced: true, createdAt: d(2),
      items: [
        { id: "oi_cafe_01", listingId: "list_cafe_01", inventoryItemId: "inv_cafe_01", name: "Ethiopian Arabica Coffee Beans", quantity: 1, unitPrice: 1200, lineTotal: 1200 },
        { id: "oi_cafe_02", listingId: "list_cafe_03", inventoryItemId: "inv_cafe_03", name: "Freshly Baked Butter Croissants", quantity: 2, unitPrice: 85, lineTotal: 170 },
      ],
    },
    // — FreshMart Grocery ———————————————————————————————————————————————————————
    {
      id: "ord_gro_01", businessId: "biz_grocery_01", customerName: "Rahul Sharma", customerPhone: "+91 9988776655",
      status: "accepted", totalAmount: 373, stockReduced: true, createdAt: d(1),
      items: [
        { id: "oi_gro_01", listingId: "list_gro_01", inventoryItemId: "inv_gro_01", name: "Parle-G Biscuits 800g", quantity: 5, unitPrice: 50, lineTotal: 250 },
        { id: "oi_gro_02", listingId: "list_gro_02", inventoryItemId: "inv_gro_03", name: "Tata Salt 1kg", quantity: 3, unitPrice: 28, lineTotal: 84 },
        { id: "oi_gro_03", listingId: "list_gro_04", inventoryItemId: "inv_gro_04", name: "Haldiram's Aloo Bhujia 400g", quantity: 1, unitPrice: 95, lineTotal: 95 },
      ],
    },
  ],
  workflows: [
    // — Urban Glow Salon ————————————————————————————————————————————————————————
    { id: "wf_salon_01", businessId: "biz_salon_01", name: "Create draft listing from scanned product", triggerType: "PRODUCT_SCANNED", description: "Turns a confirmed scan into a reviewable storefront draft.", isActive: true, nodeNames: ["Generate product description", "Create draft listing", "Request human approval"] },
    { id: "wf_salon_02", businessId: "biz_salon_01", name: "Reduce stock when order is accepted", triggerType: "ORDER_ACCEPTED", description: "Updates inventory and checks stock health after a sale.", isActive: true, nodeNames: ["Reduce stock", "Check low stock", "Send in-app notification"] },
    { id: "wf_salon_03", businessId: "biz_salon_01", name: "Low stock reorder reminder", triggerType: "LOW_STOCK_DETECTED", description: "Creates a seller task when an item needs replenishment.", isActive: true, nodeNames: ["Create seller task", "Send in-app notification"] },
    // — Corner Café —————————————————————————————————————————————————————————————
    { id: "wf_cafe_01", businessId: "biz_cafe_01", name: "New Product Scanned", triggerType: "PRODUCT_SCANNED", description: "Auto-create draft listing when a product is scanned.", isActive: true, nodeNames: ["AI generated product description", "Draft listing created", "Waiting for seller approval"] },
    { id: "wf_cafe_02", businessId: "biz_cafe_01", name: "Order Accepted", triggerType: "ORDER_ACCEPTED", description: "Reduce stock and notify customer on order acceptance.", isActive: true, nodeNames: ["Validate stock availability", "Reduce stock", "Send customer notification"] },
    { id: "wf_cafe_03", businessId: "biz_cafe_01", name: "Low Stock Alert", triggerType: "LOW_STOCK_DETECTED", description: "Alert owner when item falls below reorder threshold.", isActive: true, nodeNames: ["Detect low stock", "Create reorder task", "Send owner notification"] },
    // — FreshMart Grocery ———————————————————————————————————————————————————————
    { id: "wf_gro_01", businessId: "biz_grocery_01", name: "New Product Scanned", triggerType: "PRODUCT_SCANNED", description: "Auto-create draft listing when a product is scanned.", isActive: true, nodeNames: ["AI generated product description", "Draft listing created", "Waiting for seller approval"] },
    { id: "wf_gro_02", businessId: "biz_grocery_01", name: "Order Accepted", triggerType: "ORDER_ACCEPTED", description: "Reduce stock and notify customer on order acceptance.", isActive: true, nodeNames: ["Validate stock availability", "Reduce stock", "Send customer notification"] },
    { id: "wf_gro_03", businessId: "biz_grocery_01", name: "Low Stock Alert", triggerType: "LOW_STOCK_DETECTED", description: "Alert owner when item falls below reorder threshold.", isActive: true, nodeNames: ["Detect low stock", "Create reorder task", "Send owner notification"] },
  ],
  executions: [
    {
      id: "exec_salon_01", workflowId: "wf_salon_01", status: "waiting_for_human", trigger: "PRODUCT_SCANNED", startedAt: now,
      nodes: [
        { id: "node_s1", nodeName: "AI generated product description", nodeType: "GENERATE_PRODUCT_DESCRIPTION", status: "success", input: { inventoryItemId: "inv_4" }, output: { description: "Lightweight finishing serum for shine." }, timestamp: now },
        { id: "node_s2", nodeName: "Draft listing created", nodeType: "CREATE_DRAFT_LISTING", status: "success", input: { inventoryItemId: "inv_4" }, output: { listingId: "list_4" }, timestamp: now },
        { id: "node_s3", nodeName: "Waiting for seller approval", nodeType: "REQUEST_HUMAN_APPROVAL", status: "waiting_for_human", input: { listingId: "list_4" }, timestamp: now },
      ],
    },
    {
      id: "exec_cafe_01", workflowId: "wf_cafe_01", status: "waiting_for_human", trigger: "PRODUCT_SCANNED", startedAt: d(3),
      nodes: [
        { id: "node_c1", nodeName: "AI generated product description", nodeType: "GENERATE_PRODUCT_DESCRIPTION", status: "success", input: { inventoryItemId: "inv_cafe_01" }, output: { description: "Single-origin Ethiopian Arabica beans." }, timestamp: d(3) },
        { id: "node_c2", nodeName: "Draft listing created", nodeType: "CREATE_DRAFT_LISTING", status: "success", input: { inventoryItemId: "inv_cafe_01" }, output: { listingId: "list_cafe_01" }, timestamp: d(3) },
        { id: "node_c3", nodeName: "Waiting for seller approval", nodeType: "REQUEST_HUMAN_APPROVAL", status: "waiting_for_human", input: { listingId: "list_cafe_01" }, timestamp: d(3) },
      ],
    },
  ],
  corrections: [],
  cart: [],
};

const categoryMap: Record<BusinessType, string[]> = {
  salon: ["Haircare", "Styling", "Shaving", "Skincare", "Tools", "Cleaning"],
  cafe: ["Coffee", "Milk", "Bakery", "Syrups", "Packaging", "Cleaning"],
  grocery: ["Snacks", "Beverages", "Personal Care", "Cleaning", "Staples", "Dairy"],
};

export function getCategoryTemplates(type: BusinessType): string[] {
  return categoryMap[type] ?? ["General"];
}

// Keep for backward compat — use getCategoryTemplates() instead
export const templates = {} as const;

export function getSeedForBusiness(_type?: BusinessType): AppState {
  return initialState;
}
