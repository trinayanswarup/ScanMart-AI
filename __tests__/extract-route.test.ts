// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/extract/route";

// Minimal NextRequest mock — the handler only calls req.json()
function mockReq(body: object): Parameters<typeof POST>[0] {
  return { json: async () => body } as Parameters<typeof POST>[0];
}

// Valid AI JSON payload that passes productAIExtractionSchema
const VALID_AI_JSON = JSON.stringify({
  productName: "Monster Energy Zero Sugar",
  brand: "Monster Energy",
  category: "Beverages",
  description: "Zero-sugar canned energy drink with B vitamins.",
  suggestedUnit: "can",
  suggestedQuantity: 1,
  suggestedPrice: 2.5,
  confidence: 0.94,
  detectedText: ["Monster", "Energy", "Zero Sugar"],
  reasoningShort: "Brand logo and product name clearly visible.",
});

function makeNvidiaFetch(content: string) {
  return vi.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });
}

describe("POST /api/extract — API key guard", () => {
  const originalKey = process.env.NVIDIA_API_KEY;

  beforeEach(() => { delete process.env.NVIDIA_API_KEY; });
  afterEach(() => {
    if (originalKey !== undefined) process.env.NVIDIA_API_KEY = originalKey;
    else delete process.env.NVIDIA_API_KEY;
  });

  it("returns 500 with a clear error when NVIDIA_API_KEY is not set", async () => {
    const res = await POST(mockReq({ userText: "Monster Energy can" }));
    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/nvidia_api_key/i);
  });
});

describe("POST /api/extract — input validation", () => {
  beforeEach(() => { process.env.NVIDIA_API_KEY = "test-key"; });
  afterEach(() => { delete process.env.NVIDIA_API_KEY; });

  it("returns 400 when no image, no ocrText, and no userText are provided", async () => {
    const res = await POST(mockReq({}));
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/no input/i);
  });

  it("returns 400 when userText is an empty string", async () => {
    const res = await POST(mockReq({ userText: "   " }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/extract — JSON cleaning", () => {
  beforeEach(() => { process.env.NVIDIA_API_KEY = "test-key"; });
  afterEach(() => { delete process.env.NVIDIA_API_KEY; vi.restoreAllMocks(); });

  it("parses AI response wrapped in markdown JSON code fences", async () => {
    global.fetch = makeNvidiaFetch("```json\n" + VALID_AI_JSON + "\n```");

    const res = await POST(mockReq({ userText: "Monster Energy can" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { productName: string };
    expect(body.productName).toBe("Monster Energy Zero Sugar");
  });

  it("parses AI response wrapped in generic code fences (no language tag)", async () => {
    global.fetch = makeNvidiaFetch("```\n" + VALID_AI_JSON + "\n```");

    const res = await POST(mockReq({ userText: "Monster Energy can" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { productName: string };
    expect(body.productName).toBe("Monster Energy Zero Sugar");
  });

  it("parses AI response with leading prose before the JSON object (regression: **Product Analysis**)", async () => {
    // This is the exact bug pattern that was hit: bold header followed by newline then JSON
    const withProse = "**Product Analysis**\n\nHere are the extracted details:\n\n" + VALID_AI_JSON;
    global.fetch = makeNvidiaFetch(withProse);

    const res = await POST(mockReq({ userText: "Monster Energy can" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { productName: string };
    expect(body.productName).toBe("Monster Energy Zero Sugar");
  });

  it("parses AI response with leading prose AND markdown fences (worst-case combination)", async () => {
    const combined = "Sure! Here is the analysis:\n```json\n" + VALID_AI_JSON + "\n```\nLet me know if you need more details.";
    global.fetch = makeNvidiaFetch(combined);

    const res = await POST(mockReq({ userText: "Monster Energy can" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { productName: string };
    expect(body.productName).toBe("Monster Energy Zero Sugar");
  });

  it("returns 200 and falls back to defaults when AI omits optional fields", async () => {
    const minimal = JSON.stringify({
      productName: "Unknown Widget",
      category: "Other",
      description: "A product of unknown type.",
      suggestedUnit: "pcs",
      suggestedQuantity: 1,
      confidence: 0.4,
      detectedText: [],
      reasoningShort: "Could not identify the product reliably.",
    });
    global.fetch = makeNvidiaFetch(minimal);

    const res = await POST(mockReq({ userText: "blurry image" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { productName: string; brand: unknown };
    expect(body.productName).toBe("Unknown Widget");
    expect(body.brand).toBeUndefined();
  });

  it("returns 200 with a default reasoningShort when AI omits the field", async () => {
    const missingReasoning = JSON.stringify({
      productName: "Widget",
      category: "Other",
      description: "A product.",
      suggestedUnit: "pcs",
      suggestedQuantity: 1,
      confidence: 0.5,
      detectedText: [],
      // reasoningShort intentionally omitted — route must supply a non-empty default
    });
    global.fetch = makeNvidiaFetch(missingReasoning);

    const res = await POST(mockReq({ userText: "Widget" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { reasoningShort: string };
    expect(body.reasoningShort.length).toBeGreaterThan(0);
  });
});

describe("POST /api/extract — receipt mode", () => {
  beforeEach(() => { process.env.NVIDIA_API_KEY = "test-key"; });
  afterEach(() => { delete process.env.NVIDIA_API_KEY; vi.restoreAllMocks(); });

  it("returns items array when AI response is valid receipt JSON", async () => {
    const receiptJson = JSON.stringify({
      items: [
        { productName: "Dove Shampoo 650ml", category: "Haircare", quantity: 12, unitPrice: 349, confidence: 0.92 },
        { productName: "Cold Brew 250ml", category: "Beverages", quantity: 24, unitPrice: 89, confidence: 0.85 },
      ],
      storeName: "Metro Cash & Carry",
      receiptDate: "2026-07-20",
    });
    global.fetch = makeNvidiaFetch(receiptJson);

    const res = await POST(mockReq({ imageBase64: "abc123", mimeType: "image/jpeg", mode: "receipt" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[]; storeName: string };
    expect(body.items).toHaveLength(2);
    expect(body.storeName).toBe("Metro Cash & Carry");
  });

  it("strips markdown fences and leading prose from receipt response", async () => {
    const withProse = "Here are the items I found:\n```json\n" + JSON.stringify({
      items: [{ productName: "Parle-G Biscuits", category: "Snacks", quantity: 6, unitPrice: 25, confidence: 0.96 }],
    }) + "\n```";
    global.fetch = makeNvidiaFetch(withProse);

    const res = await POST(mockReq({ imageBase64: "abc123", mimeType: "image/jpeg", mode: "receipt" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ productName: string }> };
    expect(body.items[0].productName).toBe("Parle-G Biscuits");
  });

  it("returns empty items array when AI returns no line items", async () => {
    global.fetch = makeNvidiaFetch(JSON.stringify({ items: [], storeName: null, receiptDate: null }));

    const res = await POST(mockReq({ imageBase64: "abc123", mimeType: "image/jpeg", mode: "receipt" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { items: unknown[] };
    expect(body.items).toHaveLength(0);
  });

  it("falls back to defaults when item fields are missing or null", async () => {
    global.fetch = makeNvidiaFetch(JSON.stringify({
      items: [{ productName: "", category: null, quantity: null, unitPrice: null, confidence: null }],
    }));

    const res = await POST(mockReq({ imageBase64: "abc123", mimeType: "image/jpeg", mode: "receipt" }));
    expect(res.status).toBe(200);
    const body = await res.json() as { items: Array<{ productName: string; category: string; quantity: number; confidence: number }> };
    expect(body.items[0].productName).toBe("Unknown Product");
    expect(body.items[0].category).toBe("Other");
    expect(body.items[0].quantity).toBe(1);
    expect(body.items[0].confidence).toBe(0.5);
  });
});
