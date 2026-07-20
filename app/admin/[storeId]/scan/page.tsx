"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Barcode, Camera, CheckCircle2, FileImage, FileText, ImageUp, LoaderCircle,
  RefreshCw, ScanLine, Sparkles, Type, Wifi, WifiOff, X,
} from "lucide-react";
import { useApp } from "@/components/app-provider";
import { confidenceLabel, extractProduct, lookupBarcode } from "@/lib/ai";
import type { ProductAIExtraction } from "@/types";

type OcrVariant = { image: Blob; label: string };

async function prepareOcrVariants(file: File): Promise<OcrVariant[]> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 2000;
    const scale = Math.min(2, maxDim / Math.max(bitmap.width, bitmap.height));
    const sw = Math.max(1, Math.round(bitmap.width * scale));
    const sh = Math.max(1, Math.round(bitmap.height * scale));
    const render = async (rotation: 0 | 90 | -90, label: string): Promise<OcrVariant> => {
      const sideways = rotation !== 0;
      const canvas = document.createElement("canvas");
      canvas.width = sideways ? sh : sw;
      canvas.height = sideways ? sw : sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return { image: file, label };
      ctx.filter = "grayscale(1) contrast(1.55)";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(bitmap, -sw / 2, -sh / 2, sw, sh);
      const image = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.95));
      return { image, label };
    };
    const variants = await Promise.all([render(0, "upright"), render(90, "rotated right"), render(-90, "rotated left")]);
    bitmap.close();
    return variants;
  } catch {
    return [{ image: file, label: "original" }];
  }
}

function scoreOcr(text: string, confidence: number) {
  const n = text.toLowerCase();
  const letters = (text.match(/[a-z]/gi) ?? []).length;
  const words = (text.match(/[a-z]{3,}/gi) ?? []).length;
  const signals = ["monster", "energy", "shampoo", "coffee", "milk", "biscuit", "toothpaste", "dove", "parle"]
    .filter((s) => n.includes(s)).length;
  return confidence + Math.min(30, letters / 4) + Math.min(20, words * 2) + signals * 25;
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Mode = "photo" | "barcode" | "text" | "receipt";

type ReceiptRow = {
  checked: boolean;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number | undefined;
  confidence: number;
};

export default function AdminScanPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { getStore, addInventory, addInventoryBulk } = useApp();
  const activeStore = getStore(storeId);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [original, setOriginal] = useState<ProductAIExtraction | null>(null);
  const [result, setResult] = useState<ProductAIExtraction | null>(null);
  const [error, setError] = useState("");
  const [usedAI, setUsedAI] = useState(false);

  // Receipt-specific state
  const [receiptRows, setReceiptRows] = useState<ReceiptRow[]>([]);
  const [receiptSummary, setReceiptSummary] = useState("");

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!camera || !video || !stream) return;
    video.srcObject = stream;
    const play = async () => {
      try { await video.play(); } catch { setCameraError("Could not start camera preview."); }
    };
    if (video.readyState >= 1) void play();
    else video.addEventListener("loadedmetadata", play, { once: true });
    return () => video.removeEventListener("loadedmetadata", play);
  }, [camera]);

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) { setError("Choose an image file (JPG, PNG, WEBP)."); return; }
    setFile(selected); setPreview(URL.createObjectURL(selected)); setResult(null); setError("");
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => chooseFile(e.target.files?.[0]);
  const drop = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]); };

  const openCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCamera(true);
    } catch { setCameraError("Camera unavailable. Upload a photo instead."); }
  };
  const closeCamera = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCamera(false); };
  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => { if (blob) chooseFile(new File([blob], "camera-product.jpg", { type: "image/jpeg" })); }, "image/jpeg", 0.9);
    closeCamera();
  };

  const lookupBarcodeManual = async () => {
    const code = barcodeInput.trim();
    if (!code) { setError("Enter a barcode number first."); return; }
    setLoading(true); setError(""); setScanProgress("Looking up barcode in Open Food Facts…");
    const found = await lookupBarcode(code);
    if (found) {
      setOriginal(found); setResult(found); setUsedAI(false);
    } else {
      setError(`Barcode ${code} not found in Open Food Facts. Try scanning a product image instead.`);
    }
    setLoading(false); setScanProgress("");
  };

  const scanBarcodeFromImage = async (imageFile: File): Promise<boolean> => {
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const url = URL.createObjectURL(imageFile);
      const img = document.createElement("img");
      img.src = url;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
      const decoded = await reader.decodeFromImageElement(img);
      URL.revokeObjectURL(url);
      const barcode = decoded.getText();
      setScanProgress(`Barcode detected: ${barcode}. Looking up product…`);
      const found = await lookupBarcode(barcode);
      if (found) {
        setOriginal(found); setResult(found); setUsedAI(false);
        setLoading(false); setScanProgress("");
        return true;
      }
      setScanProgress(`Barcode ${barcode} not in database. Analyzing image with AI…`);
      return false;
    } catch {
      return false;
    }
  };

  const analyze = async () => {
    if (!file && !text.trim()) { setError("Add a product photo or enter label text first."); return; }
    setLoading(true); setError(""); setScanProgress("Starting analysis…");

    if (file && mode === "photo") {
      const barcodeHit = await scanBarcodeFromImage(file);
      if (barcodeHit) return;
    }

    let ocrText = "";
    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (file) {
      try {
        const { createWorker } = await import("tesseract.js");
        const variants = await prepareOcrVariants(file);
        let active = 0;
        const worker = await createWorker("eng", 1, {
          logger: (msg) => {
            if (msg.status === "recognizing text" && typeof msg.progress === "number") {
              const overall = Math.round(((active + msg.progress) / variants.length) * 100);
              setScanProgress(`Reading label at multiple angles… ${Math.min(overall, 100)}%`);
            }
          },
        });
        const results: Array<{ text: string; confidence: number; score: number }> = [];
        for (let i = 0; i < variants.length; i++) {
          active = i;
          const r = await worker.recognize(variants[i].image);
          results.push({ text: r.data.text.trim(), confidence: r.data.confidence, score: scoreOcr(r.data.text, r.data.confidence) });
        }
        await worker.terminate();
        results.sort((a, b) => b.score - a.score);
        const useful = results.filter((r) => (r.text.match(/[a-z]/gi) ?? []).length >= 3).slice(0, 2);
        ocrText = useful.map((r) => r.text).join("\n");
        setScanProgress("Analyzing with AI vision…");
      } catch {
        setScanProgress("OCR failed, sending image directly to AI…");
      }

      try {
        const { base64, mimeType } = await fileToBase64(file);
        imageBase64 = base64;
        imageMimeType = mimeType;
      } catch { /* continue without image */ }
    }

    const { result: extracted, usedAI: ai } = await extractProduct(
      { imageBase64, mimeType: imageMimeType, ocrText, filename: file?.name, userText: text },
      activeStore?.businessType ?? "salon",
    );

    setOriginal(extracted);
    setResult(extracted);
    setUsedAI(ai);
    setLoading(false);
    setScanProgress("");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const analyzeReceipt = async () => {
    if (!file) { setError("Add a receipt photo first."); return; }
    setLoading(true); setError(""); setReceiptSummary(""); setScanProgress("Extracting line items from receipt…");
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType, mode: "receipt", businessType: activeStore?.businessType ?? "grocery" }),
      });
      if (!res.ok) {
        setError("Failed to analyze receipt. Try again or check your connection.");
        setLoading(false); setScanProgress(""); return;
      }
      const data = await res.json() as { items?: Array<{ productName: string; category: string; quantity: number; unitPrice?: number; confidence: number }> };
      if (!data.items?.length) {
        setError("No line items found in this image. Try a clearer photo of the receipt.");
        setLoading(false); setScanProgress(""); return;
      }
      setReceiptRows(data.items.map((item) => ({
        checked: true,
        productName: item.productName,
        category: item.category,
        quantity: Math.max(1, item.quantity),
        unitPrice: item.unitPrice,
        confidence: item.confidence,
      })));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      setError("Unexpected error. Please try again.");
    }
    setLoading(false); setScanProgress("");
  };

  const updateReceiptRow = (i: number, patch: Partial<ReceiptRow>) =>
    setReceiptRows((rows) => rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const saveReceipt = () => {
    const toSave = receiptRows.filter((r) => r.checked && r.productName.trim());
    if (!toSave.length) { setError("Select at least one item to add."); return; }
    addInventoryBulk(storeId, toSave.map((r) => ({
      name: r.productName.trim(),
      category: r.category.trim() || "Other",
      quantity: r.quantity,
      price: r.unitPrice,
    })));
    const count = toSave.length;
    setReceiptSummary(`${count} item${count === 1 ? "" : "s"} added to inventory.`);
    setReceiptRows([]);
    setFile(null); setPreview("");
  };

  const update = (key: keyof ProductAIExtraction, value: string | number) =>
    result && setResult({ ...result, [key]: value });

  const save = () => {
    if (!result || !original) return;
    if (result.confidence < 0.6 && result.productName === "Unknown Product") {
      setError('Low-confidence scans require you to replace "Unknown Product" with the real product name.');
      return;
    }
    const id = addInventory(
      storeId,
      {
        name: result.productName,
        brand: result.brand,
        category: result.category,
        description: result.description,
        quantity: result.suggestedQuantity,
        unit: result.suggestedUnit,
        lowStockThreshold: activeStore?.lowStockThreshold ?? 3,
        price: result.suggestedPrice,
        source: "ai_scan",
        aiConfidence: result.confidence,
        status: "active",
      },
      original,
      result,
    );
    router.push(`/admin/${storeId}/products/${id}`);
  };

  const confidenceColor = result
    ? result.confidence >= 0.8 ? "#7CD4AC" : result.confidence >= 0.6 ? "#EB774D" : "#F85458"
    : "#A4B4CC";
  const confidenceText = result ? confidenceLabel(result.confidence) : "";

  const resetScan = () => { setResult(null); setOriginal(null); setFile(null); setPreview(""); setError(""); };

  const switchMode = (m: Mode) => {
    closeCamera();
    setMode(m);
    setResult(null); setError("");
    setFile(null); setPreview("");
    setReceiptRows([]); setReceiptSummary("");
  };

  const checkedCount = receiptRows.filter((r) => r.checked).length;

  return (
    <div className="page-wrap" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">AI-Powered</div>
          <h1>Scan product</h1>
          <p>Upload a photo, scan a barcode, or describe the label — AI does the rest.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "var(--canvas)", padding: 4, borderRadius: 8, width: "fit-content" }}>
        {([
          ["photo", "Photo / Camera", FileImage],
          ["barcode", "Barcode", Barcode],
          ["text", "Text Entry", Type],
          ["receipt", "Receipt / Invoice", FileText],
        ] as const).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 6, border: "none",
              background: mode === m ? "var(--surface)" : "transparent",
              color: mode === m ? "var(--ink)" : "var(--muted)",
              fontWeight: mode === m ? 700 : 500,
              fontSize: 14,
              boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              cursor: "pointer",
              transition: ".15s ease",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === "photo" && (
        <div className="card" style={{ padding: 24 }}>
          {!camera ? (
            <>
              <div
                onDrop={drop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !file && inputRef.current?.click()}
                style={{
                  border: `2px dashed ${file ? "var(--sage)" : "var(--line)"}`,
                  borderRadius: 8, padding: 32, textAlign: "center",
                  background: file ? "var(--brand-soft)" : "var(--canvas)",
                  cursor: file ? "default" : "pointer", transition: ".18s",
                  position: "relative",
                }}
              >
                {file && preview ? (
                  <div>
                    <img src={preview} alt="Product preview" style={{ maxHeight: 240, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(""); setResult(null); }}
                      style={{ position: "absolute", top: 10, right: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--canvas)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--brand)" }}>
                      <ImageUp size={22} />
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Drop a product photo here</p>
                    <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>or click to browse · JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => inputRef.current?.click()}>
                  <FileImage size={15} /> Choose file
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={openCamera}>
                  <Camera size={15} /> Use camera
                </button>
              </div>
              {cameraError && <p style={{ color: "#F85458", fontSize: 13, marginTop: 10 }}>{cameraError}</p>}
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <video ref={videoRef} style={{ width: "100%", borderRadius: 8, background: "#000" }} playsInline muted />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={capture}><Camera size={15} /> Capture</button>
                <button className="btn btn-secondary" onClick={closeCamera}><X size={15} /> Cancel</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <label className="label">Additional label text (optional)</label>
            <textarea
              className="textarea"
              placeholder="Type brand name, product details, or price to improve AI accuracy…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ minHeight: 72 }}
            />
          </div>

          {error && <p style={{ color: "#F85458", fontSize: 13, marginTop: 10 }}>{error}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16, minHeight: 48 }}
            onClick={analyze}
            disabled={loading || (!file && !text.trim())}
          >
            {loading
              ? <><LoaderCircle size={16} style={{ animation: "spin 1s linear infinite" }} />{scanProgress || "Analyzing…"}</>
              : <><Sparkles size={16} />Analyze with AI</>}
          </button>
        </div>
      )}

      {mode === "barcode" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Barcode number</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                ref={barcodeInputRef}
                className="input"
                placeholder="e.g. 8901030876035"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void lookupBarcodeManual()}
              />
              <button className="btn btn-primary" onClick={lookupBarcodeManual} disabled={loading}>
                {loading ? <LoaderCircle size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Barcode size={16} />}
                Lookup
              </button>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Enter the barcode from any packaged product. Powered by Open Food Facts.
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Or upload an image with a barcode</p>
            <div
              onDrop={drop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              style={{ border: "2px dashed var(--line)", borderRadius: 8, padding: 20, textAlign: "center", cursor: "pointer", background: "var(--canvas)" }}
            >
              {file
                ? <p style={{ margin: 0, fontSize: 13, color: "#2C645B", fontWeight: 600 }}>{file.name}</p>
                : <p style={{ margin: 0, fontSize: 13 }} className="muted">Drop image here or click to browse</p>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
            {file && (
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={analyze} disabled={loading}>
                {loading
                  ? <><LoaderCircle size={16} style={{ animation: "spin 1s linear infinite" }} />{scanProgress}</>
                  : <><Barcode size={15} />Detect Barcode</>}
              </button>
            )}
          </div>

          {error && <p style={{ color: "#F85458", fontSize: 13, marginTop: 10 }}>{error}</p>}
        </div>
      )}

      {mode === "text" && (
        <div className="card" style={{ padding: 24 }}>
          <label className="label">Describe the product</label>
          <textarea
            className="textarea"
            placeholder="Type product name, brand, category, price… e.g. 'Dove Intense Repair Shampoo 650ml €349'"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: 120 }}
          />
          {error && <p style={{ color: "#F85458", fontSize: 13, marginTop: 8 }}>{error}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16, minHeight: 48 }}
            onClick={analyze}
            disabled={loading || !text.trim()}
          >
            {loading
              ? <><LoaderCircle size={16} style={{ animation: "spin 1s linear infinite" }} />{scanProgress || "Analyzing…"}</>
              : <><Sparkles size={16} />Extract with AI</>}
          </button>
        </div>
      )}

      {mode === "receipt" && (
        <div className="card" style={{ padding: 24 }}>
          {!camera ? (
            <>
              <div
                onDrop={drop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !file && inputRef.current?.click()}
                style={{
                  border: `2px dashed ${file ? "var(--sage)" : "var(--line)"}`,
                  borderRadius: 8, padding: 32, textAlign: "center",
                  background: file ? "var(--brand-soft)" : "var(--canvas)",
                  cursor: file ? "default" : "pointer", transition: ".18s",
                  position: "relative",
                }}
              >
                {file && preview ? (
                  <div>
                    <img src={preview} alt="Receipt preview" style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }} />
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(""); setReceiptRows([]); }}
                      style={{ position: "absolute", top: 10, right: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--canvas)", display: "grid", placeItems: "center", margin: "0 auto 12px", color: "var(--brand)" }}>
                      <FileText size={22} />
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Drop your receipt or invoice here</p>
                    <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>or click to browse · JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => inputRef.current?.click()}>
                  <FileImage size={15} /> Choose file
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={openCamera}>
                  <Camera size={15} /> Use camera
                </button>
              </div>
              {cameraError && <p style={{ color: "#F85458", fontSize: 13, marginTop: 10 }}>{cameraError}</p>}
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <video ref={videoRef} style={{ width: "100%", borderRadius: 8, background: "#000" }} playsInline muted />
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={capture}><Camera size={15} /> Capture</button>
                <button className="btn btn-secondary" onClick={closeCamera}><X size={15} /> Cancel</button>
              </div>
            </div>
          )}

          {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 10 }}>{error}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 16, minHeight: 48 }}
            onClick={analyzeReceipt}
            disabled={loading || !file}
          >
            {loading
              ? <><LoaderCircle size={16} style={{ animation: "spin 1s linear infinite" }} />{scanProgress || "Analyzing receipt…"}</>
              : <><Sparkles size={16} />Extract line items</>}
          </button>
        </div>
      )}

      {/* ─── Receipt results table ─── */}
      {mode === "receipt" && receiptRows.length > 0 && (
        <div ref={resultRef} className="card" style={{ marginTop: 20, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div className="eyebrow">Receipt scan</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Review extracted items</h2>
            </div>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
              {checkedCount} of {receiptRows.length} selected
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  <th style={{ width: 36, padding: "8px 12px 8px 0", textAlign: "left" }}>
                    <input
                      type="checkbox"
                      checked={receiptRows.length > 0 && receiptRows.every((r) => r.checked)}
                      onChange={(e) => setReceiptRows((rows) => rows.map((r) => ({ ...r, checked: e.target.checked })))}
                    />
                  </th>
                  {["Product", "Category", "Qty", "Price (₹)", "Conf."].map((h) => (
                    <th key={h} style={{ textAlign: h === "Qty" || h === "Price (₹)" || h === "Conf." ? "right" : "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receiptRows.map((row, i) => {
                  const conf = row.confidence;
                  const confColor = conf >= 0.8 ? "#7CD4AC" : conf >= 0.6 ? "#EB774D" : "#F85458";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line)", opacity: row.checked ? 1 : 0.4, transition: "opacity .15s" }}>
                      <td style={{ padding: "10px 12px 10px 0" }}>
                        <input type="checkbox" checked={row.checked} onChange={(e) => updateReceiptRow(i, { checked: e.target.checked })} />
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <input
                          className="input"
                          style={{ minWidth: 150, padding: "5px 8px", fontSize: 13 }}
                          value={row.productName}
                          onChange={(e) => updateReceiptRow(i, { productName: e.target.value })}
                        />
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <input
                          className="input"
                          style={{ minWidth: 100, padding: "5px 8px", fontSize: 13 }}
                          value={row.category}
                          onChange={(e) => updateReceiptRow(i, { category: e.target.value })}
                        />
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          style={{ width: 64, padding: "5px 8px", fontSize: 13, textAlign: "right" }}
                          value={row.quantity}
                          onChange={(e) => updateReceiptRow(i, { quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="—"
                          style={{ width: 80, padding: "5px 8px", fontSize: 13, textAlign: "right" }}
                          value={row.unitPrice ?? ""}
                          onChange={(e) => updateReceiptRow(i, { unitPrice: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
                        />
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: confColor, background: confColor + "22", border: `1px solid ${confColor}44` }}>
                          {Math.round(conf * 100)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 12 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, minHeight: 46 }}
              onClick={saveReceipt}
              disabled={checkedCount === 0}
            >
              <CheckCircle2 size={16} />
              Add {checkedCount} item{checkedCount === 1 ? "" : "s"} to inventory
            </button>
            <button className="btn btn-secondary" onClick={() => { setReceiptRows([]); setFile(null); setPreview(""); }}>
              <RefreshCw size={15} /> Scan again
            </button>
          </div>
        </div>
      )}

      {/* ─── Receipt success summary ─── */}
      {mode === "receipt" && receiptSummary && (
        <div className="notice" style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={16} />
          {receiptSummary}
          <Link href={`/admin/${storeId}/inventory`} style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "var(--brand)", whiteSpace: "nowrap" }}>
            View inventory →
          </Link>
        </div>
      )}

      {/* ─── Single-product result ─── */}
      {result && (
        <div ref={resultRef} className="card" style={{ marginTop: 20, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div className="eyebrow">Extraction result</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 18 }}>Review and save</h2>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--canvas)", border: "1px solid var(--line)", borderRadius: 4, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                {usedAI ? <Wifi size={12} color="#2C645B" /> : <WifiOff size={12} color="#65777a" />}
                {usedAI ? "AI Vision" : "Offline mode"}
              </span>
              <span style={{ background: confidenceColor + "22", color: confidenceColor === "#7CD4AC" ? "#092922" : confidenceColor, border: `1px solid ${confidenceColor}40`, borderRadius: 4, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
                {Math.round(result.confidence * 100)}% · {confidenceText}
              </span>
            </div>
          </div>

          {result.confidence < 0.6 && (
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "var(--danger)" }}>
              Low confidence. Please verify all fields before saving.
            </div>
          )}

          <div className="form-grid">
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Product name</label>
              <input className="input" value={result.productName} onChange={(e) => update("productName", e.target.value)} />
            </div>
            <div>
              <label className="label">Brand</label>
              <input className="input" value={result.brand ?? ""} onChange={(e) => update("brand", e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={result.category} onChange={(e) => update("category", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Description</label>
              <textarea className="textarea" value={result.description} onChange={(e) => update("description", e.target.value)} style={{ minHeight: 80 }} />
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input className="input" type="number" min="0" value={result.suggestedPrice ?? ""} onChange={(e) => update("suggestedPrice", parseFloat(e.target.value))} placeholder="Enter price" />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="select" value={result.suggestedUnit} onChange={(e) => update("suggestedUnit", e.target.value)}>
                {["pcs", "kg", "g", "ml", "l", "pack", "box", "bottle", "can", "bag"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Opening stock</label>
              <input className="input" type="number" min="1" value={result.suggestedQuantity} onChange={(e) => update("suggestedQuantity", parseInt(e.target.value))} />
            </div>
          </div>

          {result.detectedText.length > 0 && (
            <div style={{ marginTop: 16, background: "var(--canvas)", borderRadius: 6, padding: "10px 14px" }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Detected text</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{result.detectedText.join(" · ")}</p>
            </div>
          )}

          <div style={{ marginTop: 16, background: "var(--brand-soft)", borderRadius: 6, padding: "10px 14px", fontSize: 12, color: "var(--brand)" }}>
            <strong>AI reasoning:</strong> {result.reasoningShort}
          </div>

          {error && <p style={{ color: "#F85458", fontSize: 13, marginTop: 12 }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" style={{ flex: 1, minHeight: 46 }} onClick={save}>
              <CheckCircle2 size={16} /> Save to inventory
            </button>
            <button className="btn btn-secondary" onClick={resetScan}>
              <RefreshCw size={15} /> Scan again
            </button>
          </div>
        </div>
      )}

      <span style={{ display: "none" }}><ScanLine size={0} /></span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
