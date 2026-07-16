import { NextRequest, NextResponse } from "next/server";
import { productAIExtractionSchema } from "@/lib/validation";

const PROMPT = `You are a product label analyzer for ScanMart AI, an inventory management system for small businesses.
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      ocrText?: string;
      userText?: string;
      businessType?: string;
    };

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "NVIDIA_API_KEY not configured" }, { status: 500 });
    }

    const prompt = PROMPT.replace("{BUSINESS_TYPE}", body.businessType ?? "general retail");

    const contentParts: Array<Record<string, unknown>> = [];

    let textPrompt = prompt;
    if (body.ocrText?.trim()) {
      textPrompt += `\n\nOCR text also detected (may be unreliable, use image as primary source): ${body.ocrText.trim()}`;
    }
    if (body.userText?.trim()) {
      textPrompt += `\n\nUser-provided hint: ${body.userText.trim()}`;
    }
    textPrompt += "\n\nReturn JSON only:";

    contentParts.push({ type: "text", text: textPrompt });

    if (body.imageBase64 && body.mimeType) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${body.mimeType};base64,${body.imageBase64}` },
      });
    }

    if (!body.imageBase64 && !body.userText?.trim() && !body.ocrText?.trim()) {
      return NextResponse.json({ error: "No input provided" }, { status: 400 });
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-90b-vision-instruct",
        messages: [{ role: "user", content: contentParts }],
        max_tokens: 512,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[/api/extract] NVIDIA API error", response.status, errText);
      return NextResponse.json({ error: "AI extraction failed" }, { status: 500 });
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

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
      reasoningShort: parsed.reasoningShort ?? "",
    });

    return NextResponse.json(validated);
  } catch (err) {
    console.error("[/api/extract]", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}