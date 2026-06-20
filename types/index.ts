export type BusinessType = "salon" | "cafe" | "grocery";
export type ProductSource = "manual" | "ai_scan" | "receipt" | "import";
export type OrderStatus = "new" | "accepted" | "completed" | "cancelled";
export type ExecutionStatus = "running" | "success" | "failed" | "waiting_for_human" | "skipped";

export interface Business {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  lowStockThreshold: number;
}

export interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  brand?: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  price?: number;
  imageUrl?: string;
  source: ProductSource;
  aiConfidence?: number;
  status: "draft" | "active" | "archived";
  createdAt: string;
}

export interface ProductListing {
  id: string;
  businessId: string;
  inventoryItemId: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  isPublished: boolean;
}

export interface CartItem {
  listingId: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  listingId: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  businessId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  stockReduced: boolean;
}

export interface ProductAIExtraction {
  productName: string;
  brand?: string;
  category: string;
  subcategory?: string;
  description: string;
  suggestedUnit: string;
  suggestedQuantity: number;
  suggestedPrice?: number;
  confidence: number;
  detectedText: string[];
  reasoningShort: string;
}

export interface WorkflowNodeExecution {
  id: string;
  nodeName: string;
  nodeType: string;
  status: ExecutionStatus;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  trigger: string;
  startedAt: string;
  nodes: WorkflowNodeExecution[];
}

export interface Workflow {
  id: string;
  businessId: string;
  name: string;
  triggerType: string;
  description: string;
  isActive: boolean;
  nodeNames: string[];
}

export interface CorrectionLog {
  id: string;
  inventoryItemId: string;
  original: ProductAIExtraction;
  corrected: ProductAIExtraction;
  createdAt: string;
}

export interface AppState {
  business: Business;
  inventory: InventoryItem[];
  listings: ProductListing[];
  orders: Order[];
  workflows: Workflow[];
  executions: WorkflowExecution[];
  corrections: CorrectionLog[];
  cart: CartItem[];
}
