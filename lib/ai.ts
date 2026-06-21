import { productAIExtractionSchema } from "@/lib/validation";
import type { BusinessType, ProductAIExtraction } from "@/types";

export interface ProductScanInput {
  ocrText?: string;
  filename?: string;
  userText?: string;
}

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
  { brand: "Kingston", keywords: ["kingston"] },
  { brand: "Seagate", keywords: ["seagate"] },
  { brand: "Sony", keywords: ["sony"] },
  { brand: "Philips", keywords: ["philips"] },
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

const normalizeOcrText = (value: string) => value
  .toLowerCase()
  .replace(/\b(?:moniter|monter|moncter|mon5ter|m0nster)\b/g, "monster")
  .replace(/\b(?:enerdy|eneroy|enerqy|enercy|encrgy)\b/g, "energy")
  .replace(/\b(?:red\s*bull|redbull|red\s*buii|red\s*buli)\b/g, "red bull")
  .replace(/\bta\s*rin(?:e)?\b/g, "taurine")
  .replace(/\bzero\s*sug(?:ar|or|er)\b/g, "zero sugar")
  .replace(/[^a-z0-9&.+\s-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();
const titleCase = (value: string) => value
  .toLowerCase()
  .replace(/\b(?:hdd|ssd|usb|tb|gb|mb|wd|ai)\b/g, (word) => word.toUpperCase())
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

function cleanLines(input: ProductScanInput) {
  const source = [input.ocrText, input.userText, input.filename && !/camera[-_ ]?product/i.test(input.filename) ? input.filename.replace(/\.[^.]+$/, "") : ""]
    .filter(Boolean)
    .join("\n");

  const seen = new Set<string>();
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/[|_[\]{}]/g, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 2 && line.length <= 80)
    .filter((line) => !noisePatterns.some((pattern) => pattern.test(line)))
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
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

function specializedExtraction(text: string, businessType: BusinessType, detectedText: string[]): ProductAIExtraction | null {
  if (/\bmonster\b/.test(text) && /\benergy\b/.test(text)) {
    const zeroSugar = /zero\s+sugar/.test(text);
    return makeResult({
      productName: `Monster Energy${zeroSugar ? " Zero Sugar" : " Drink"}`,
      brand: "Monster Energy",
      category: "Beverages",
      description: `${zeroSugar ? "Zero-sugar " : "Canned "}energy drink.`,
      confidence: 0.9,
      detectedText,
      reasoning: "OCR contained fuzzy but matching Monster and Energy brand signals across the label.",
    });
  }
  if (/\bred\s+bull\b/.test(text)) {
    return makeResult({ productName: "Red Bull Energy Drink", brand: "Red Bull", category: "Beverages", description: "Canned energy drink.", confidence: /\benergy\b|\bdrink\b/.test(text) ? 0.92 : 0.88, detectedText, reasoning: "OCR identified the Red Bull brand; the product is classified as its standard energy drink." });
  }
  if (/\bwd\s+elements\b|portable\s+hdd|portable\s+hard\s+drive/.test(text)) {
    const capacity = text.match(/\b\d+(?:\.\d+)?\s?(?:tb|gb)\b/i)?.[0]?.toUpperCase().replace(/\s/g, " ");
    return makeResult({
      productName: `WD Elements${capacity ? ` ${capacity}` : ""} Portable HDD`,
      brand: "Western Digital",
      category: "Electronics",
      description: `Portable external hard drive${capacity ? ` with ${capacity} storage capacity` : ""}.`,
      confidence: 0.91,
      detectedText,
      reasoning: "OCR identified the WD Elements product line and the Portable HDD product type.",
    });
  }
  if (text.includes("shampoo")) return makeResult({ productName: text.includes("dove") ? "Dove Shampoo" : "Shampoo", brand: text.includes("dove") ? "Dove" : undefined, category: businessType === "salon" ? "Haircare" : "Personal Care", description: "Shampoo for regular hair cleansing and care.", price: text.includes("dove") ? 349 : undefined, confidence: text.includes("dove") ? 0.94 : 0.82, detectedText, reasoning: "OCR identified shampoo wording and a matching brand where available." });
  if (text.includes("coffee")) return makeResult({ productName: text.includes("arabica") ? "Arabica Coffee Beans" : "Coffee", category: "Coffee", description: "Packaged coffee product.", confidence: 0.86, detectedText, reasoning: "OCR identified coffee-related product wording." });
  if (text.includes("milk")) return makeResult({ productName: "Whole Milk", category: businessType === "cafe" ? "Milk" : "Dairy", description: "Packaged whole milk.", confidence: 0.84, detectedText, reasoning: "OCR identified milk as the main product type." });
  if (text.includes("mic") && text.includes("ric") && text.includes("biscuit")) return makeResult({ productName: "Hello! Chocolate Biscuits", brand: "Mic & Ric", category: "Snacks", description: "Chocolate-flavoured packaged biscuits.", confidence: 0.9, detectedText, reasoning: "OCR identified the brand, product line, and biscuit type." });
  if (text.includes("parle")) return makeResult({ productName: "Parle-G Biscuits", brand: "Parle", category: "Snacks", description: "Packaged glucose biscuits.", price: 25, confidence: 0.96, detectedText, reasoning: "OCR identified the Parle-G product name." });
  if (text.includes("biscuit")) return makeResult({ productName: text.includes("chocolate") ? "Chocolate Biscuits" : "Biscuits", category: "Snacks", description: `${text.includes("chocolate") ? "Chocolate-flavoured" : "Packaged"} biscuits.`, confidence: 0.8, detectedText, reasoning: "OCR identified biscuits as the product type." });
  if (text.includes("toothpaste")) return makeResult({ productName: text.includes("colgate") ? "Colgate Toothpaste" : "Toothpaste", brand: text.includes("colgate") ? "Colgate" : undefined, category: "Personal Care", description: "Everyday toothpaste.", confidence: text.includes("colgate") ? 0.93 : 0.81, detectedText, reasoning: "OCR identified toothpaste wording and a matching brand where available." });
  if (/hair\s+wax|\bwax\b/.test(text)) return makeResult({ productName: "Hair Wax", category: "Styling", description: "Hair styling wax.", confidence: 0.82, detectedText, reasoning: "OCR identified hair wax as the product type." });
  return null;
}

export function mockExtractProduct(input: ProductScanInput, businessType: BusinessType): ProductAIExtraction {
  const lines = cleanLines(input);
  const detectedText = lines.slice(0, 8);
  const text = normalizeOcrText(lines.join(" "));
  const specialized = specializedExtraction(text, businessType, detectedText);
  if (specialized) return specialized;

  const brand = brandRules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))?.brand;
  const category = categoryRules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)))?.category ?? "Other";
  const informativeLines = lines.filter((line) => /[a-z]{3}/i.test(line) && !/^\d+[\s\w.-]*$/i.test(line));
  const primary = informativeLines[0];
  const secondary = informativeLines.slice(1).find((line) => line.length <= 35 && !primary?.toLowerCase().includes(line.toLowerCase()));

  if (primary) {
    const rawName = [primary, secondary].filter(Boolean).join(" ").replace(/\s+/g, " ");
    const productName = titleCase(rawName).slice(0, 70);
    const confidence = Math.min(0.79, 0.57 + (brand ? 0.08 : 0) + (category !== "Other" ? 0.09 : 0) + (informativeLines.length > 1 ? 0.05 : 0));
    return makeResult({
      productName,
      brand,
      category,
      description: `${category === "Other" ? "Packaged product" : category} identified from the visible label: ${productName}.`,
      confidence,
      detectedText,
      reasoning: `OCR found ${informativeLines.length} useful label line${informativeLines.length === 1 ? "" : "s"}${brand ? ` and matched the ${brand} brand` : ""}${category !== "Other" ? `; keywords indicate ${category}` : ""}. Please review ambiguous fields.`,
    });
  }

  return makeResult({
    productName: "Unknown Product",
    category: "Other",
    description: "The label could not be read clearly. Retake the photo closer to the front label or enter label text manually.",
    confidence: 0.3,
    detectedText: detectedText.length ? detectedText : ["No readable label text detected"],
    reasoning: "OCR did not find enough readable product text to create a reliable record.",
  });
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 0.8) return "High confidence";
  if (confidence >= 0.6) return "Needs review";
  return "Manual correction required";
}
