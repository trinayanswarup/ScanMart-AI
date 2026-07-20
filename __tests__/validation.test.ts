import { describe, it, expect } from "vitest";
import { productAIExtractionSchema } from "@/lib/validation";

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
