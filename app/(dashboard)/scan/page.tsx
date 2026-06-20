"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, FileImage, ImageUp, LoaderCircle, RefreshCw, ScanLine, Sparkles, Type, Video, X } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { confidenceLabel, mockExtractProduct } from "@/lib/ai";
import { templates } from "@/lib/seed";
import type { ProductAIExtraction } from "@/types";

export default function ScanPage() {
  const { state, addInventory } = useApp();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [text, setText] = useState("");
  const [camera, setCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [original, setOriginal] = useState<ProductAIExtraction | null>(null);
  const [result, setResult] = useState<ProductAIExtraction | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!camera || !video || !stream) return;

    video.srcObject = stream;
    const startPlayback = async () => {
      try {
        await video.play();
      } catch {
        setCameraError("The camera opened, but the browser could not start the preview. Try closing and reopening it.");
      }
    };

    if (video.readyState >= 1) {
      void startPlayback();
    } else {
      video.addEventListener("loadedmetadata", startPlayback, { once: true });
    }

    return () => video.removeEventListener("loadedmetadata", startPlayback);
  }, [camera]);
  const chooseFile = (selected?: File) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) { setError("Choose an image file such as JPG, PNG, or WEBP."); return; }
    setFile(selected); setPreview(URL.createObjectURL(selected)); setResult(null); setError("");
  };
  const onFile = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);
  const drop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); };
  const openCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCamera(true);
    } catch { setCameraError("Camera access is unavailable. Upload a photo or use the text fallback instead."); }
  };
  const closeCamera = () => { streamRef.current?.getTracks().forEach((track) => track.stop()); streamRef.current = null; setCamera(false); };
  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0); canvas.toBlob((blob) => { if (blob) chooseFile(new File([blob], "camera-product.jpg", { type: "image/jpeg" })); }, "image/jpeg", .9);
    closeCamera();
  };
  const analyze = async () => {
    if (!file && !text.trim()) { setError("Add a product photo or describe the label first."); return; }
    setLoading(true);
    setError("");
    setScanProgress(file ? "Reading text from the product label…" : "Structuring product details…");

    let detectedLabel = "";
    if (file) {
      try {
        const { recognize } = await import("tesseract.js");
        const response = await recognize(file, "eng", {
          logger: (message) => {
            if (message.status === "recognizing text" && typeof message.progress === "number") {
              setScanProgress(`Reading product label… ${Math.round(message.progress * 100)}%`);
            }
          },
        });
        detectedLabel = response.data.text;
      } catch {
        setScanProgress("OCR could not read the label; using filename and entered text…");
      }
    }

    const extracted = mockExtractProduct(
      `${file?.name ?? ""} ${detectedLabel} ${text}`,
      state.business.businessType,
    );
    setOriginal(extracted);
    setResult(extracted);
    setLoading(false);
    setScanProgress("");
  };
  const update = (key: keyof ProductAIExtraction, value: string | number) => result && setResult({ ...result, [key]: value });
  const save = () => {
    if (!result || !original) return;
    if (result.confidence < .6 && result.productName === "Unknown Product") { setError("Low-confidence scans require you to replace “Unknown Product” before saving."); return; }
    const id = addInventory({ name: result.productName, brand: result.brand, category: result.category, description: result.description, quantity: result.suggestedQuantity, unit: result.suggestedUnit, lowStockThreshold: state.business.lowStockThreshold, price: result.suggestedPrice, imageUrl: preview, source: "ai_scan", aiConfidence: result.confidence, status: "active" }, original, result);
    router.push(`/products/${id}`);
  };

  if (result) return <div className="page-wrap" style={{ maxWidth: 1040 }}><div className="page-header"><div><div className="eyebrow">Human-in-the-loop review</div><h1>Review the AI extraction.</h1><p>Every field is editable before anything reaches inventory.</p></div><button className="btn btn-secondary" onClick={() => setResult(null)}><RefreshCw size={15} />Scan again</button></div>
    <div className="grid-2" style={{ gridTemplateColumns: ".72fr 1.28fr" }}><section className="card" style={{ padding: 18 }}><div style={{ aspectRatio: "4/5", borderRadius: 14, background: "#edf1ee", overflow: "hidden", display: "grid", placeItems: "center" }}>{preview ? <img src={preview} alt="Product preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FileImage size={52} color="#9aa59d" />}</div><div style={{ marginTop: 16 }}><span className={`badge ${result.confidence >= .8 ? "badge-green" : result.confidence >= .6 ? "badge-amber" : "badge-red"}`}>{confidenceLabel(result.confidence)} · {Math.round(result.confidence * 100)}%</span><div style={{ height: 7, background: "#edf1ee", borderRadius: 99, marginTop: 12 }}><i style={{ display: "block", width: `${result.confidence * 100}%`, height: "100%", borderRadius: 99, background: result.confidence >= .8 ? "#73AB95" : result.confidence >= .6 ? "#EB774D" : "#F85458" }} /></div></div><div className="subtle-card" style={{ marginTop: 16, padding: 14 }}><span className="label">Why AI chose this</span><p className="muted" style={{ fontSize: 12, lineHeight: 1.55, margin: 0 }}>{result.reasoningShort}</p></div><div style={{ marginTop: 16 }}><span className="label">Detected text</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{result.detectedText.map((item) => <span className="badge badge-gray" key={item}>{item}</span>)}</div></div></section>
    <section className="card" style={{ padding: 25 }}><div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 22 }}><div className="empty-icon" style={{ margin: 0, width: 38, height: 38 }}><Sparkles size={18} /></div><div><h2 className="section-title">Structured product data</h2><span className="muted" style={{ fontSize: 11 }}>Confirm or correct each field</span></div></div>
      <div className="form-grid"><div><label className="label">Product name *</label><input className="input" value={result.productName} onChange={(e) => update("productName", e.target.value)} /></div><div><label className="label">Brand</label><input className="input" value={result.brand ?? ""} onChange={(e) => update("brand", e.target.value)} /></div><div><label className="label">Category *</label><select className="select" value={result.category} onChange={(e) => update("category", e.target.value)}>{[...new Set([...templates[state.business.businessType], result.category, "Other"])].map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="label">Suggested price (₹)</label><input className="input" type="number" value={result.suggestedPrice ?? ""} onChange={(e) => update("suggestedPrice", Number(e.target.value))} /></div><div><label className="label">Quantity *</label><input className="input" type="number" value={result.suggestedQuantity} onChange={(e) => update("suggestedQuantity", Number(e.target.value))} /></div><div><label className="label">Unit *</label><select className="select" value={result.suggestedUnit} onChange={(e) => update("suggestedUnit", e.target.value)}>{["pcs", "packs", "kg", "g", "litres", "ml", "boxes"].map((item) => <option key={item}>{item}</option>)}</select></div></div><div style={{ marginTop: 17 }}><label className="label">Description *</label><textarea className="textarea" value={result.description} onChange={(e) => update("description", e.target.value)} /></div>{error && <div className="error-text">{error}</div>}<div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}><button className="btn btn-primary" onClick={save}><CheckCircle2 size={17} />Confirm & add to inventory</button></div></section></div></div>;

  return <div className="page-wrap" style={{ maxWidth: 1000 }}><div className="page-header"><div><div className="eyebrow">AI product capture</div><h1>Scan a product.</h1><p>Use the device you have—phone camera, webcam, photo upload, or label text.</p></div></div>
    <div className="grid-2" style={{ gridTemplateColumns: "1.25fr .75fr" }}><section className="card" style={{ padding: 24 }}><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}><div className="empty-icon" style={{ margin: 0, width: 40, height: 40 }}><ImageUp size={19} /></div><div><h2 className="section-title">Product image</h2><span className="muted" style={{ fontSize: 11 }}>Best results: front label, good light, minimal glare</span></div></div>
      {camera ? <div className="camera-box"><video ref={videoRef} autoPlay playsInline muted /><div className="camera-actions"><button className="btn btn-secondary" onClick={closeCamera}><X size={16} />Cancel</button><button className="capture-btn" aria-label="Take photo" onClick={capture}><i /></button><span style={{ width: 83 }} /></div></div> :
      preview ? <div className="preview-box"><img src={preview} alt="Selected product" /><button className="btn btn-secondary" onClick={() => { setFile(null); setPreview(""); }}><X size={15} />Remove</button></div> :
      <div className="upload-zone" onDragOver={(e) => e.preventDefault()} onDrop={drop} onClick={() => inputRef.current?.click()}><div className="upload-icon"><ScanLine size={27} /></div><strong>Drop a product photo here</strong><span>or click to browse from this computer</span><span className="file-types">JPG, PNG, WEBP · up to 10 MB</span><input ref={inputRef} type="file" accept="image/*" onChange={onFile} hidden /></div>}
      {!camera && <div className="capture-options"><button className="btn btn-secondary" onClick={() => inputRef.current?.click()}><FileImage size={16} />Upload photo</button><button className="btn btn-secondary" onClick={openCamera}><Video size={16} />Use webcam</button><label className="btn btn-secondary" style={{ cursor: "pointer" }}><Camera size={16} />Take photo on phone<input type="file" accept="image/*" capture="environment" hidden onChange={onFile} /></label></div>}
      {cameraError && <div className="error-text">{cameraError}</div>}
    </section>
    <aside className="card" style={{ padding: 24 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="empty-icon" style={{ margin: 0, width: 40, height: 40, background: "#F6F6F6", color: "#A4B4CC" }}><Type size={18} /></div><div><h2 className="section-title">Label text fallback</h2><span className="muted" style={{ fontSize: 11 }}>Useful on a monitor without a camera</span></div></div><p className="muted" style={{ fontSize: 12, lineHeight: 1.6, margin: "18px 0 10px" }}>Type anything visible on the package. In demo mode, keywords drive the extraction.</p><textarea className="textarea" style={{ minHeight: 130 }} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Try “Dove shampoo 500ml” or “Parle-G biscuits”'} /><div className="subtle-card" style={{ padding: 13, marginTop: 13, fontSize: 11, lineHeight: 1.55, color: "#66736b" }}><strong style={{ color: "#28352c" }}>Demo tip:</strong> Try shampoo, coffee, milk, biscuit, toothpaste, or wax.</div></aside></div>
    {error && <div className="error-text" style={{ textAlign: "center", marginTop: 14 }}>{error}</div>}<div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 22, gap: 9 }}><button className="btn btn-primary" style={{ minWidth: 230, minHeight: 48 }} onClick={analyze} disabled={loading}>{loading ? <><LoaderCircle size={17} className="spin" />Analyzing product...</> : <><Sparkles size={17} />Extract product details</>}</button>{loading && <span className="muted" style={{ fontSize: 11 }}>{scanProgress}</span>}</div>
    <div className="scan-steps"><span><b>1</b>Capture</span><i /><span><b>2</b>AI extraction</span><i /><span><b>3</b>Your review</span><i /><span><b>4</b>Inventory</span></div>
    <style jsx>{`
      .upload-zone{height:350px;border:1.5px dashed #bfcac2;border-radius:15px;background:#fafcfb;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:.18s}.upload-zone:hover{border-color:#73AB95;background:#F6F6F6}.upload-icon{width:60px;height:60px;border-radius:18px;background:#F6F6F6;color:#2C645B;display:grid;place-items:center;margin-bottom:18px}.upload-zone strong{font-size:14px}.upload-zone span{font-size:12px;color:#758078;margin-top:7px}.upload-zone .file-types{font-size:9px;margin-top:18px;text-transform:uppercase;letter-spacing:.08em}.capture-options{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.capture-options .btn{flex:1;padding:0 10px;white-space:nowrap}.preview-box,.camera-box{height:350px;border-radius:15px;overflow:hidden;position:relative;background:#092922}.preview-box img,.camera-box video{width:100%;height:100%;object-fit:contain}.preview-box .btn{position:absolute;right:12px;top:12px}.camera-actions{position:absolute;inset:auto 0 0;display:flex;align-items:center;justify-content:space-between;padding:16px;background:linear-gradient(transparent,rgb(0 0 0 / 70%))}.capture-btn{width:62px;height:62px;border:3px solid white;border-radius:50%;background:transparent;display:grid;place-items:center}.capture-btn i{width:48px;height:48px;border-radius:50%;background:white}.scan-steps{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:34px;color:#79847d;font-size:10px;font-weight:700}.scan-steps span{display:flex;align-items:center;gap:6px}.scan-steps b{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#F6F6F6;color:#2C645B}.scan-steps i{height:1px;width:50px;background:#dfe5e1}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:700px){.scan-steps{display:none}.capture-options{display:grid;grid-template-columns:1fr}.upload-zone,.preview-box,.camera-box{height:300px}}
    `}</style>
  </div>;
}

