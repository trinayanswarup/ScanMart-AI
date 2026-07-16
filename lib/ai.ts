import { productAIExtractionSchema } from "@/lib/validation";
import type { BusinessType, ProductAIExtraction } from "@/types";

export interface ProductScanInput {
  imageBase64?: string;
  mimeType?: string;
  ocrText?: string;
  filename?: string;
  userText?: string;
}

// — AI extraction (NVIDIA vision) ————————————————————————————————————————————

export async function extractProduct(
  input: ProductScanInput,
  businessType: BusinessType,
): Promise<{ result: ProductAIExtraction; usedAI: boolean }> {
  if (input.imageBase64 || input.ocrText?.trim() || input.userText?.trim()) {
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: input.imageBase64,
          mimeType: input.mimeType,
          ocrText: input.ocrText,
          userText: input.userText,
          businessType,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as ProductAIExtraction;
        return { result: data, usedAI: true };
      }
    } catch {
      // fall through to mock
    }
  }
  return { result: mockExtractProduct(input, businessType), usedAI: false };
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) return "High confidence";
  if (confidence >= 0.6) return "Needs review";
  return "Manual correction required";
}

// — Open Food Facts barcode lookup ——————————————————————————————————————————

export async function lookupBarcode(barcode: string): Promise<ProductAIExtraction | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        categories_tags?: string[];
        generic_name?: string;
        quantity?: string;
      };
    };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const productName = p.product_name || p.generic_name || "Unknown Product";
    const brand = p.brands?.split(",")[0]?.trim();
    const rawCategory = p.categories_tags?.[0]?.replace("en:", "").replace(/-/g, " ") ?? "Other";
    const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);

    return productAIExtractionSchema.parse({
      productName: productName.slice(0, 70),
      brand,
      category,
      description: `${productName}${brand ? ` by ${brand}` : ""}. ${p.quantity ? `Pack size: ${p.quantity}.` : ""}`.trim(),
      suggestedUnit: "pcs",
      suggestedQuantity: 1,
      suggestedPrice: undefined,
      confidence: 0.92,
      detectedText: [barcode, productName, brand ?? ""].filter(Boolean),
      reasoningShort: `Barcode ${barcode} matched Open Food Facts database with high confidence.`,
    });
  } catch {
    return null;
  }
}

// — Mock fallback (offline / no API key) ————————————————————————————————————

const categoryRules: Array<{ category: string; keywords: string[] }> = [
  { category: "Electronics", keywords: ["hdd", "hard drive", "ssd", "usb", "portable drive", "headphone", "earphone", "charger", "adapter", "keyboard", "mouse", "speaker", "power bank", "battery"] },
  { category: "Haircare", keywords: ["shampoo", "conditioner", "hair oil", "hair serum"] },
  { category: "Styling", keywords: ["hair wax", "pomade", "hair gel", "styling spray"] },
  { category: "Personal Care", keywords: ["toothpaste", "toothbrush", "soap", "body wash", "deodorant", "lotion"] },
  { category: "Coffee", keywords: ["coffee", "arabica", "robusta", "espresso"] },
  { category: "Dairy", keywords: ["milk", "yogurt", "yoghurt", "cheese", "butter", "curd"] },
  { category: "Snacks", keywords: ["biscuit", "cookie", "chips", "cracker", "snack", "wafer"] },
  { category: "Beverages", keywords: ["energy drink", "energy", "juice", "drink", "soda", "water", "tea"] },
  { category: "Cleaning", keywords: ["cleaner", "detergent", "dishwash", "floor wash", "sanitizer"] },
  { category: "Tools", keywords: ["razor", "clipper", "trimmer", "scissors", "dryer", "brush"] },
];

const brandRules: Array<{ brand: string; keywords: string[] }> = [
  { brand: "Western Digital", keywords: ["western digital", "wd elements", "wd "] },
  { brand: "Monster Energy", keywords: ["monster energy", "monster"] },
  { brand: "Red Bull", keywords: ["red bull"] },
  { brand: "Dove", keywords: ["dove"] },
  { brand: "Colgate", keywords: ["colgate"] },
  { brand: "Parle", keywords: ["parle"] },
  { brand: "Mic & Ric", keywords: ["mic & ric", "mic and ric"] },
  { brand: "Samsung", keywords: ["samsung"] },
  { brand: "SanDisk", keywords: ["sandisk"] },
  { brand: "Nestlé", keywords: ["nestle", "nestlé"] },
];

const noisePatterns = [
  /camera[-_ ]?product/i,
  /\.(jpe?g|png|webp|heic)$/i,
  /www\.|https?:/i,
  /made in/i,
  /customer care/i,
  /manufactured by/i,
  /marketed by/i,
  /maximum retail price/i,
  /all rights reserved/i,
];

const normalizeOcrText = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b(?:moniter|monter|mon5ter|m0nster)\b/g, "monster")
    .replace(/\b(?:enerdy|eneroy|enerqy)\b/g, "energy")
    .replace(/\b(?:red\s*bull|redbull|red\s*buii)\b/g, "red bull")
    .replace(/[^a-z0-9&.+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b(?:hdd|ssd|usb|tb|gb|wd|ai)\b/g, (w) => w.toUpperCase())
    .replace(/\b\w/g, (l) => l.toUpperCase());

function cleanLines(input: ProductScanInput) {
  const source = [
    input.ocrText,
    input.userText,
    input.filename && !/camera[-_ ]?product/i.test(input.filename) ? input.filename.replace(/\.[^.]+$/, "") : "",
  ]
    .filter(Boolean)
    .join("\n");
  const seen = new Set<string>();
  return source
    .split(/\r?\n/)
    .map((l) => l.replace(/[|_[\]{}]/g, " ").replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 2 && l.length <= 80)
    .filter((l) => !noisePatterns.some((p) => p.test(l)))
    .filter((l) => {
      const k = l.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function makeResult(values: {
  productName: string;
  brand?: string;
  category: string;
  description: string;
  price?: number;
  confidence: number;
  detectedText: string[];
  reasoning: string;
  unit?: string;
  quantity?: number;
}): ProductAIExtraction {
  return productAIExtractionSchema.parse({
    productName: values.productName,
    brand: values.brand,
    category: values.category,
    description: values.description,
    suggestedUnit: values.unit ?? "pcs",
    suggestedQuantity: values.quantity ?? 1,
    suggestedPrice: values.price,
    confidence: values.confidence,
    detectedText: values.detectedText,
    reasoningShort: values.reasoning,
  });
}

export function mockExtractProduct(input: ProductScanInput, businessType: BusinessType): ProductAIExtraction {
  const lines = cleanLines(input);
  const detectedText = lines.slice(0, 8);
  const text = normalizeOcrText(lines.join(" "));

  if (/\bmonster\b/.test(text) && /\benergy\b/.test(text)) {
    const zero = /zero\s+sugar/.test(text);
    return makeResult({ productName: `Monster Energy${zero ? " Zero Sugar" : " Drink"}`, brand: "Monster Energy", category: "Beverages", description: `${zero ? "Zero-sugar " : "Canned "}energy drink.`, confidence: 0.9, detectedText, reasoning: "Matched Monster Energy brand signals." });
  }
  if (/\bred\s+bull\b/.test(text)) return makeResult({ productName: "Red Bull Energy Drink", brand: "Red Bull", category: "Beverages", description: "Canned energy drink.", confidence: 0.92, detectedText, reasoning: "Red Bull brand clearly identified." });
  if (text.includes("shampoo")) return makeResult({ productName: text.includes("dove") ? "Dove Shampoo" : "Shampoo", brand: text.includes("dove") ? "Dove" : undefined, category: businessType === "salon" ? "Haircare" : "Personal Care", description: "Shampoo for hair cleansing.", price: text.includes("dove") ? 349 : undefined, confidence: text.includes("dove") ? 0.94 : 0.82, detectedText, reasoning: "Shampoo product type identified." });
  if (text.includes("parle")) return makeResult({ productName: "Parle-G Biscuits", brand: "Parle", category: "Snacks", description: "Packaged glucose biscuits.", price: 25, confidence: 0.96, detectedText, reasoning: "Parle-G brand clearly identified." });
  if (text.includes("coffee")) return makeResult({ productName: text.includes("arabica") ? "Arabica Coffee Beans" : "Coffee", category: "Coffee", description: "Packaged coffee product.", confidence: 0.86, detectedText, reasoning: "Coffee product identified." });

  const brand = brandRules.find((r) => r.keywords.some((k) => text.includes(k)))?.brand;
  const category = categoryRules.find((r) => r.keywords.some((k) => text.includes(k)))?.category ?? "Other";
  const informative = lines.filter((l) => /[a-z]{3}/i.test(l) && !/^\d+[\s\w.-]*$/i.test(l));
  const primary = informative[0];

  if (primary) {
    const productName = titleCase([primary, informative[1]].filter(Boolean).join(" ").replace(/\s+/g, " ")).slice(0, 70);
    const confidence = Math.min(0.79, 0.57 + (brand ? 0.08 : 0) + (category !== "Other" ? 0.09 : 0) + (informative.length > 1 ? 0.05 : 0));
    return makeResult({ productName, brand, category, description: `${category} product: ${productName}.`, confidence, detectedText, reasoning: `Found ${informative.length} label line(s)${brand ? `, matched ${brand} brand` : ""}.` });
  }

  return makeResult({ productName: "Unknown Product", category: "Other", description: "Label could not be read clearly. Retake closer to the front label or enter text manually.", confidence: 0.3, detectedText: detectedText.length ? detectedText : ["No readable text found"], reasoning: "Insufficient OCR data for reliable identification." });
}
