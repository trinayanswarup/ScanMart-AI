import { NextRequest, NextResponse } from "next/server";
import { productAIExtractionSchema, receiptExtractionSchema } from "@/lib/validation";

const PRODUCT_PROMPT = `You are a product label analyzer for ScanMart AI, an inventory management system for small businesses.
Analyze the product image carefully and extract structured data.

Business context: {BUSINESS_TYPE}

Return ONLY valid JSON (no markdown, no backticks, no explanation before or after):
{
  "productName": "Clear product name, max 70 chars, title case",
  "brand": "Brand name or null",
  "category": "Electronics | Haircare | Styling | Personal Care | Coffee | Dairy | Snacks | Beverages | Cleaning | Tools | Food | Other",
  "description": "1-2 sentence factual product description based on what you see",
  "suggestedUnit": "pcs | kg | g | ml | l | pack | box | bottle | can | bag",
  "suggestedQuantity": 1,
  "suggestedPrice": null or number if a price is visible on the label,
  "confidence": 0.0 to 1.0,
  "detectedText": ["key", "text", "fragments", "visible", "on", "label"],
  "reasoningShort": "One sentence explaining your confidence"
}

Confidence guide:
- 0.85–1.0: Product name, brand, and category all clearly visible and identifiable
- 0.65–0.84: Product identified but some fields uncertain or partially obscured
- 0.40–0.64: Partial identification, some guessing involved
- Below 0.40: Cannot identify reliably, manual entry required

Look carefully at the image even if partially obscured by fingers, angled, or has glare. Use brand logos, colors, can/bottle shape, and any visible text.`;

const RECEIPT_PROMPT = `You are analyzing a supplier receipt or invoice image for a retail business.
Extract every line item as a product entry. Return ONLY valid JSON:
{
  "items": [
    { "productName": "...", "category": "...", "quantity": number, "unitPrice": number or null, "confidence": 0.0-1.0 }
  ],
  "storeName": "supplier name if visible, or null",
  "receiptDate": "date if visible as YYYY-MM-DD, or null"
}
Extract every distinct product line item. If price or quantity is unclear, use your best estimate and lower confidence for that item.
Ignore subtotals, tax lines, and grand totals — only individual product line items.
Categories: Electronics | Haircare | Styling | Personal Care | Coffee | Dairy | Snacks | Beverages | Cleaning | Tools | Food | Other
CRITICAL: Return ONLY the raw JSON object. No markdown, no backticks, no explanatory text.`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      ocrText?: string;
      userText?: string;
      businessType?: string;
      mode?: "product" | "receipt";
    };

    const mode = body.mode ?? "product";

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    if (!body.imageBase64 && !body.userText?.trim() && !body.ocrText?.trim()) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const contentParts: Array<Record<string, unknown>> = [];

    if (mode === "receipt") {
      let textPrompt = RECEIPT_PROMPT;
      if (body.userText?.trim()) textPrompt += `\n\nAdditional context: ${body.userText.trim()}`;
      contentParts.push({ type: "text", text: textPrompt });
    } else {
      const basePrompt = PRODUCT_PROMPT.replace("{BUSINESS_TYPE}", body.businessType ?? "general retail");
      let textPrompt = basePrompt;
      if (body.ocrText?.trim()) textPrompt += `\n\nOCR text also detected (may be unreliable, use image as primary source): ${body.ocrText.trim()}`;
      if (body.userText?.trim()) textPrompt += `\n\nUser-provided hint: ${body.userText.trim()}`;
      textPrompt += "\n\nCRITICAL: Return ONLY the raw JSON object. Do not include any markdown formatting, headers, bold text, or explanatory text before or after the JSON.";
      textPrompt += "\n\nReturn JSON only:";
      contentParts.push({ type: "text", text: textPrompt });
    }

    if (body.imageBase64 && body.mimeType) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${body.mimeType};base64,${body.imageBase64}` },
      });
    }

    // Add a 25-second timeout so the UI doesn't hang forever if NVIDIA API stalls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [{ role: "user", content: contentParts }],
        max_tokens: mode === "receipt" ? 1024 : 512,
        temperature: 0.2,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error("[/api/extract] NVIDIA API error", response.status, errText);
      return NextResponse.json({ error: "AI extraction failed" }, { status: 500 });
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences and any leading/trailing prose
    let cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    // Extract just the JSON object if there's surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch (parseErr) {
      console.error("[/api/extract] Failed to parse AI response:", raw);
      throw parseErr;
    }

    if (mode === "receipt") {
      const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
      const validated = receiptExtractionSchema.parse({
        items: (rawItems as Record<string, unknown>[]).map((item) => ({
          productName: (typeof item.productName === "string" && item.productName.trim()) || "Unknown Product",
          category: (typeof item.category === "string" && item.category.trim()) || "Other",
          quantity: typeof item.quantity === "number" && item.quantity >= 0 ? item.quantity : 1,
          unitPrice: typeof item.unitPrice === "number" && item.unitPrice >= 0 ? item.unitPrice : undefined,
          confidence: typeof item.confidence === "number" ? Math.min(1, Math.max(0, item.confidence)) : 0.5,
        })),
        storeName: typeof parsed.storeName === "string" ? parsed.storeName : undefined,
        receiptDate: typeof parsed.receiptDate === "string" ? parsed.receiptDate : undefined,
      });
      return NextResponse.json(validated);
    }

    const validated = productAIExtractionSchema.parse({
      productName: (typeof parsed.productName === "string" && parsed.productName.trim()) || "Unknown Product",
      brand: parsed.brand ?? undefined,
      category: (typeof parsed.category === "string" && parsed.category.trim()) || "Other",
      description: (typeof parsed.description === "string" && parsed.description.trim()) || "No description available.",
      suggestedUnit: parsed.suggestedUnit ?? "pcs",
      suggestedQuantity: parsed.suggestedQuantity ?? 1,
      suggestedPrice: parsed.suggestedPrice ?? undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      detectedText: Array.isArray(parsed.detectedText) ? parsed.detectedText : [],
      reasoningShort: (typeof parsed.reasoningShort === "string" && parsed.reasoningShort.trim()) || "Extracted from product image.",
    });

    return NextResponse.json(validated);
  } catch (err: unknown) {
    console.error("[/api/extract]", err);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "AI service is currently busy. Please try again or enter details manually." }, { status: 504 });
    }
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
