import { describe, it, expect, vi, afterEach } from "vitest";
import { confidenceLabel, lookupBarcode } from "@/lib/ai";

describe("confidenceLabel boundary tests", () => {
  it("returns 'High confidence' at exactly 0.8 (lower boundary)", () => {
    expect(confidenceLabel(0.8)).toBe("High confidence");
  });

  it("returns 'Needs review' at 0.79 (just below the 0.8 threshold)", () => {
    expect(confidenceLabel(0.79)).toBe("Needs review");
  });

  it("returns 'Needs review' at exactly 0.6 (lower boundary of middle tier)", () => {
    expect(confidenceLabel(0.6)).toBe("Needs review");
  });

  it("returns 'Manual correction required' at 0.59 (just below the 0.6 threshold)", () => {
    expect(confidenceLabel(0.59)).toBe("Manual correction required");
  });

  it("returns 'Manual correction required' at 0 (absolute minimum)", () => {
    expect(confidenceLabel(0)).toBe("Manual correction required");
  });

  it("returns 'High confidence' at 1 (absolute maximum)", () => {
    expect(confidenceLabel(1)).toBe("High confidence");
  });

  it("returns 'High confidence' for values in the middle of the high tier (0.9)", () => {
    expect(confidenceLabel(0.9)).toBe("High confidence");
  });

  it("returns 'Needs review' for values in the middle of the medium tier (0.7)", () => {
    expect(confidenceLabel(0.7)).toBe("Needs review");
  });

  it("returns 'Manual correction required' for values in the low tier (0.3)", () => {
    expect(confidenceLabel(0.3)).toBe("Manual correction required");
  });
});

describe("lookupBarcode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when Open Food Facts returns status 0 (not found)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: async () => ({ status: 0 }),
    } as Response);

    const result = await lookupBarcode("0000000000000");
    expect(result).toBeNull();
  });

  it("returns null when status is 1 but product field is absent", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: async () => ({ status: 1 }),
    } as Response);

    const result = await lookupBarcode("9999999999999");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws (network failure) without re-throwing", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("Network failure"));
    const result = await lookupBarcode("1234567890123");
    expect(result).toBeNull();
  });

  it("returns a validated ProductAIExtraction for a found product", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: async () => ({
        status: 1,
        product: {
          product_name: "Barilla Spaghetti No. 5",
          brands: "Barilla, Pasta Co",
          categories_tags: ["en:dry-pastas", "en:pastas"],
          quantity: "500g",
        },
      }),
    } as Response);

    const result = await lookupBarcode("8076800195057");
    expect(result).not.toBeNull();
    expect(result?.productName).toBe("Barilla Spaghetti No. 5");
    expect(result?.brand).toBe("Barilla"); // first brand only, trimmed
    // first tag: "en:dry-pastas" → "dry-pastas" → "dry pastas" → "Dry pastas"
    expect(result?.category).toBe("Dry pastas");
    expect(result?.confidence).toBe(0.92);
    expect(result?.suggestedUnit).toBe("pcs");
    expect(result?.detectedText).toContain("8076800195057");
    expect(result?.detectedText).toContain("Barilla Spaghetti No. 5");
    expect(result?.detectedText).toContain("Barilla");
  });

  it("uses generic_name as fallback when product_name is absent", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      json: async () => ({
        status: 1,
        product: {
          generic_name: "Table Salt",
          categories_tags: ["en:salts"],
        },
      }),
    } as Response);

    const result = await lookupBarcode("5000000000000");
    expect(result).not.toBeNull();
    expect(result?.productName).toBe("Table Salt");
  });
});
