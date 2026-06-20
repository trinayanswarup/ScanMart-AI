import { productAIExtractionSchema } from "@/lib/validation";
import type { BusinessType, ProductAIExtraction } from "@/types";

const result = (
  productName: string,
  brand: string | undefined,
  category: string,
  description: string,
  price: number,
  confidence: number,
  detectedText: string[],
): ProductAIExtraction => ({
  productName,
  brand,
  category,
  description,
  suggestedUnit: "pcs",
  suggestedQuantity: 1,
  suggestedPrice: price,
  confidence,
  detectedText,
  reasoningShort: `Matched recognizable product terms and assigned the closest inventory category.`,
});

export function mockExtractProduct(input: string, businessType: BusinessType): ProductAIExtraction {
  const text = input.toLowerCase();
  let extraction: ProductAIExtraction;

  if (text.includes("shampoo")) {
    extraction = result("Dove Shampoo", "Dove", businessType === "salon" ? "Haircare" : "Personal Care", "Nourishing daily shampoo for clean, soft hair.", 349, 0.94, ["Dove", "Shampoo"]);
  } else if (text.includes("coffee")) {
    extraction = result("Arabica Coffee Beans", undefined, "Coffee", "Rich, aromatic whole Arabica coffee beans.", 699, 0.91, ["100% Arabica", "Coffee beans"]);
  } else if (text.includes("milk")) {
    extraction = result("Whole Milk", undefined, businessType === "cafe" ? "Milk" : "Dairy", "Fresh full-cream whole milk.", 68, 0.88, ["Whole milk", "1 L"]);
  } else if (text.includes("mic") && text.includes("ric") && text.includes("biscuit")) {
    extraction = result("Hello! Chocolate Biscuits", "Mic & Ric", "Snacks", "Chocolate-flavoured biscuits in a 160 g pack.", 35, 0.9, ["Mic & Ric", "Hello!", "Biscuits", "Chocolate flavour", "160 g"]);
  } else if (text.includes("parle")) {
    extraction = result("Parle-G Biscuits", "Parle", "Snacks", "Classic crunchy glucose biscuits.", 25, 0.96, ["Parle-G", "Original glucose"]);
  } else if (text.includes("biscuit")) {
    extraction = result("Chocolate Biscuits", undefined, "Snacks", "Packaged chocolate-flavoured biscuits.", 35, 0.82, ["Biscuits", "Chocolate flavour"]);
  } else if (text.includes("toothpaste")) {
    extraction = result("Colgate Toothpaste", "Colgate", "Personal Care", "Everyday cavity-protection toothpaste.", 110, 0.93, ["Colgate", "Strong teeth"]);
  } else if (text.includes("wax")) {
    extraction = result("Hair Wax", undefined, "Styling", "Medium-hold styling wax with a natural finish.", 299, 0.86, ["Hair wax", "Medium hold"]);
  } else {
    extraction = result("Unknown Product", undefined, "Other", "Product details need manual review.", 99, 0.45, [input || "No label text detected"]);
  }

  return productAIExtractionSchema.parse(extraction);
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) return "High confidence";
  if (confidence >= 0.6) return "Needs review";
  return "Manual correction required";
}
