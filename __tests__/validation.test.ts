import { describe, it, expect } from "vitest";
import { productAIExtractionSchema, receiptLineItemSchema, receiptExtractionSchema } from "@/lib/validation";

const VALID = {
  productName: "Dove Intense Repair Shampoo",
  category: "Haircare",
  description: "Nourishing shampoo for damaged hair.",
  suggestedUnit: "pcs",
  suggestedQuantity: 1,
  confidence: 0.85,
  detectedText: ["Dove", "Shampoo"],
  reasoningShort: "Brand and product type clearly visible on label",
};

describe("productAIExtractionSchema", () => {
  it("rejects empty productName", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, productName: "" });
    expect(r.success).toBe(false);
  });

  it("rejects empty description", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, description: "" });
    expect(r.success).toBe(false);
  });

  it("rejects missing reasoningShort", () => {
    const { reasoningShort: _omit, ...rest } = VALID;
    const r = productAIExtractionSchema.safeParse(rest);
    expect(r.success).toBe(false);
  });

  it("accepts minimal valid payload and leaves optional fields undefined", () => {
    const r = productAIExtractionSchema.safeParse(VALID);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.productName).toBe("Dove Intense Repair Shampoo");
    expect(r.data.brand).toBeUndefined();
    expect(r.data.suggestedPrice).toBeUndefined();
    expect(r.data.subcategory).toBeUndefined();
  });

  it("accepts full payload with all optional fields populated", () => {
    const r = productAIExtractionSchema.safeParse({
      ...VALID,
      brand: "Dove",
      subcategory: "Repair",
      suggestedPrice: 349,
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.brand).toBe("Dove");
    expect(r.data.suggestedPrice).toBe(349);
    expect(r.data.subcategory).toBe("Repair");
  });

  it("coerces suggestedQuantity from string to number", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, suggestedQuantity: "3" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.suggestedQuantity).toBe(3);
  });

  it("accepts suggestedQuantity of 0 (not yet received)", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, suggestedQuantity: 0 });
    expect(r.success).toBe(true);
  });

  it("rejects confidence above 1.0", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, confidence: 1.01 });
    expect(r.success).toBe(false);
  });

  it("rejects confidence below 0", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, confidence: -0.1 });
    expect(r.success).toBe(false);
  });

  it("accepts confidence at exact boundary values 0.0 and 1.0", () => {
    expect(productAIExtractionSchema.safeParse({ ...VALID, confidence: 0 }).success).toBe(true);
    expect(productAIExtractionSchema.safeParse({ ...VALID, confidence: 1 }).success).toBe(true);
  });

  it("rejects negative suggestedPrice", () => {
    const r = productAIExtractionSchema.safeParse({ ...VALID, suggestedPrice: -5 });
    expect(r.success).toBe(false);
  });
});

const VALID_RECEIPT_ITEM = {
  productName: "Dove Shampoo 650ml",
  category: "Haircare",
  quantity: 12,
  unitPrice: 349,
  confidence: 0.91,
};

describe("receiptLineItemSchema", () => {
  it("accepts a fully-populated line item", () => {
    const r = receiptLineItemSchema.safeParse(VALID_RECEIPT_ITEM);
    expect(r.success).toBe(true);
  });

  it("accepts a line item without unitPrice (supplier receipt may omit prices)", () => {
    const { unitPrice: _omit, ...rest } = VALID_RECEIPT_ITEM;
    const r = receiptLineItemSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.unitPrice).toBeUndefined();
  });

  it("rejects empty productName", () => {
    expect(receiptLineItemSchema.safeParse({ ...VALID_RECEIPT_ITEM, productName: "" }).success).toBe(false);
  });

  it("rejects negative quantity", () => {
    expect(receiptLineItemSchema.safeParse({ ...VALID_RECEIPT_ITEM, quantity: -1 }).success).toBe(false);
  });

  it("rejects confidence above 1.0", () => {
    expect(receiptLineItemSchema.safeParse({ ...VALID_RECEIPT_ITEM, confidence: 1.01 }).success).toBe(false);
  });

  it("rejects negative unitPrice", () => {
    expect(receiptLineItemSchema.safeParse({ ...VALID_RECEIPT_ITEM, unitPrice: -10 }).success).toBe(false);
  });
});

describe("receiptExtractionSchema", () => {
  it("accepts a valid receipt with multiple items", () => {
    const r = receiptExtractionSchema.safeParse({
      items: [VALID_RECEIPT_ITEM, { ...VALID_RECEIPT_ITEM, productName: "Cold Brew 250ml", category: "Beverages" }],
      storeName: "Metro Cash & Carry",
      receiptDate: "2026-07-20",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.items).toHaveLength(2);
    expect(r.data.storeName).toBe("Metro Cash & Carry");
  });

  it("accepts an empty items array (AI found no line items)", () => {
    const r = receiptExtractionSchema.safeParse({ items: [] });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.items).toHaveLength(0);
  });

  it("accepts receipt without optional storeName and receiptDate", () => {
    const r = receiptExtractionSchema.safeParse({ items: [VALID_RECEIPT_ITEM] });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.storeName).toBeUndefined();
    expect(r.data.receiptDate).toBeUndefined();
  });

  it("rejects when items array is missing entirely", () => {
    expect(receiptExtractionSchema.safeParse({ storeName: "Store" }).success).toBe(false);
  });
});
