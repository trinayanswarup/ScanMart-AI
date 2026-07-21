"""Pydantic models mirroring types/index.ts — camelCase to match the TS frontend."""
from typing import Any, Optional
from pydantic import BaseModel


# ── Response models ───────────────────────────────────────────────────────────

class Company(BaseModel):
    id: str
    name: str


class Business(BaseModel):
    id: str
    name: str
    slug: str
    businessType: str
    lowStockThreshold: float


class InventoryItem(BaseModel):
    id: str
    businessId: str
    name: str
    brand: Optional[str] = None
    category: str
    description: str
    quantity: float
    unit: str
    lowStockThreshold: float
    price: Optional[float] = None
    imageUrl: Optional[str] = None
    source: str
    aiConfidence: Optional[float] = None
    status: str
    createdAt: str


class ProductListing(BaseModel):
    id: str
    businessId: str
    inventoryItemId: str
    title: str
    description: str
    price: float
    imageUrl: Optional[str] = None
    isPublished: bool


class OrderItem(BaseModel):
    id: str
    listingId: str
    inventoryItemId: str
    name: str
    quantity: float
    unitPrice: float
    lineTotal: float


class Order(BaseModel):
    id: str
    businessId: str
    customerName: str
    customerPhone: Optional[str] = None
    customerEmail: Optional[str] = None
    status: str
    totalAmount: float
    items: list[OrderItem]
    createdAt: str
    stockReduced: bool


class WorkflowNodeExecution(BaseModel):
    id: str
    nodeName: str
    nodeType: str
    status: str
    input: dict[str, Any]
    output: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str


class WorkflowExecution(BaseModel):
    id: str
    workflowId: str
    status: str
    trigger: str
    startedAt: str
    nodes: list[WorkflowNodeExecution]


class Workflow(BaseModel):
    id: str
    businessId: str
    name: str
    triggerType: str
    description: str
    isActive: bool
    nodeNames: list[str]


# ── Request models ────────────────────────────────────────────────────────────

class NewInventoryRequest(BaseModel):
    name: str
    brand: Optional[str] = None
    category: str
    description: str = ""
    quantity: float = 0
    unit: str = "pcs"
    lowStockThreshold: float = 3
    price: Optional[float] = None
    imageUrl: Optional[str] = None
    source: str = "manual"
    aiConfidence: Optional[float] = None
    status: str = "active"
    # AI correction snapshot — logged when the seller edits AI output before saving
    original: Optional[dict[str, Any]] = None
    corrected: Optional[dict[str, Any]] = None


class InventoryPatch(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    lowStockThreshold: Optional[float] = None
    price: Optional[float] = None
    imageUrl: Optional[str] = None
    status: Optional[str] = None


class ListingPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    isPublished: Optional[bool] = None


class CartItem(BaseModel):
    storeId: str
    listingId: str
    inventoryItemId: str
    productName: str
    price: float
    quantity: int


class PlaceOrderRequest(BaseModel):
    cart: list[CartItem]
    customerName: str
    customerPhone: Optional[str] = None
    customerEmail: Optional[str] = None


class OrderStatusRequest(BaseModel):
    status: str
