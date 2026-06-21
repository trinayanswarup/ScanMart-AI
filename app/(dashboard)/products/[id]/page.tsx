"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Bot, Check, Clock3, Edit3, Package, Save, Send, Store, X } from "lucide-react";
import { useApp } from "@/components/app-provider";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, saveListing, updateInventory } = useApp();
  const item = state.inventory.find((entry) => entry.id === id);
  const listing = state.listings.find((entry) => entry.inventoryItemId === id);
  const correction = state.corrections.find((entry) => entry.inventoryItemId === id);
  const [editingListing, setEditingListing] = useState(false);
  const [listingForm, setListingForm] = useState({ title: "", description: "", price: "" });
  const [listingMessage, setListingMessage] = useState("");

  if (!item) return <div className="page-wrap"><div className="empty"><h2>Product not found</h2><Link href="/inventory" className="btn btn-primary">Back to inventory</Link></div></div>;

  const openListingEditor = () => {
    setListingForm({
      title: listing?.title ?? item.name,
      description: listing?.description ?? item.description,
      price: String(listing?.price || item.price || ""),
    });
    setListingMessage("");
    setEditingListing(true);
  };

  const submitListing = () => {
    const result = saveListing(item.id, {
      title: listingForm.title,
      description: listingForm.description,
      price: Number(listingForm.price),
    });
    setListingMessage(result.message);
    if (result.ok) setEditingListing(false);
  };

  return <div className="page-wrap">
    <Link href="/inventory" className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 12 }}><ArrowLeft size={16} />Back to inventory</Link>
    <div className="page-header">
      <div><div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1>{item.name}</h1><span className={`badge ${item.quantity <= item.lowStockThreshold ? "badge-amber" : "badge-green"}`}>{item.quantity <= item.lowStockThreshold ? "Low stock" : "In stock"}</span></div><p>{item.brand || "Unbranded"} · {item.category}</p></div>
      <div style={{ display: "flex", gap: 9 }}>{listing?.isPublished && <Link href={`/store/${state.business.slug}`} className="btn btn-secondary"><Store size={16} />View store</Link>}<button className="btn btn-primary" onClick={openListingEditor}><Send size={16} />{listing?.isPublished ? "Update listing" : "Publish product"}</button></div>
    </div>

    {listingMessage && <div className={listingMessage === "Storefront listing updated." ? "notice" : "error-text"} style={{ marginBottom: 18 }}>{listingMessage}</div>}

    {editingListing && <section className="card listing-editor">
      <div className="editor-header"><div><h2 className="section-title">{listing?.isPublished ? "Update storefront listing" : "Publish product"}</h2><p>These fields are what customers see in the public store.</p></div><button className="btn btn-ghost" onClick={() => setEditingListing(false)}><X size={16} />Close</button></div>
      <div className="form-grid"><div><label className="label">Listing title *</label><input className="input" value={listingForm.title} onChange={(event) => setListingForm({ ...listingForm, title: event.target.value })} /></div><div><label className="label">Price (₹) *</label><input className="input" type="number" min="0" step="0.01" value={listingForm.price} onChange={(event) => setListingForm({ ...listingForm, price: event.target.value })} /></div></div>
      <div style={{ marginTop: 17 }}><label className="label">Storefront description *</label><textarea className="textarea" value={listingForm.description} onChange={(event) => setListingForm({ ...listingForm, description: event.target.value })} /></div>
      {listingMessage && listingMessage !== "Storefront listing updated." && <div className="error-text">{listingMessage}</div>}
      <div className="editor-actions"><button className="btn btn-secondary" onClick={() => setEditingListing(false)}>Cancel</button><button className="btn btn-primary" onClick={submitListing}><Save size={16} />Save & publish</button></div>
    </section>}

    <div className="grid-2" style={{ gridTemplateColumns: "1.2fr .8fr" }}><section className="card" style={{ padding: 24 }}><div style={{ display: "flex", justifyContent: "space-between" }}><h2 className="section-title">Product information</h2><button className="btn btn-ghost" onClick={() => { const quantity = prompt("Update quantity", String(item.quantity)); if (quantity !== null && Number(quantity) >= 0) updateInventory(item.id, { quantity: Number(quantity) }); }}><Edit3 size={15} />Edit stock</button></div><div className="grid-2" style={{ marginTop: 22 }}>{[{ label: "Current stock", value: `${item.quantity} ${item.unit}` }, { label: "Price", value: item.price ? `₹${item.price}` : "Not set" }, { label: "Low-stock threshold", value: `${item.lowStockThreshold} ${item.unit}` }, { label: "Source", value: item.source.replace("_", " ") }].map((data) => <div className="subtle-card" style={{ padding: 16 }} key={data.label}><span className="muted" style={{ fontSize: 11 }}>{data.label}</span><strong style={{ display: "block", marginTop: 7, textTransform: data.label === "Source" ? "capitalize" : undefined }}>{data.value}</strong></div>)}</div><div style={{ marginTop: 24 }}><span className="label">Description</span><p className="muted" style={{ lineHeight: 1.7 }}>{item.description}</p></div></section>
      <aside style={{ display: "grid", gap: 20 }}><section className="card" style={{ padding: 22 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="empty-icon" style={{ margin: 0, width: 38, height: 38 }}><Bot size={18} /></div><div><h2 className="section-title">AI extraction</h2><span className="muted" style={{ fontSize: 11 }}>{item.source === "ai_scan" ? "Generated from a product scan" : "Not AI-generated"}</span></div></div>{item.aiConfidence ? <><div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 12 }}><span>Confidence</span><strong>{Math.round(item.aiConfidence * 100)}%</strong></div><div style={{ height: 7, background: "#edf1ee", borderRadius: 4, marginTop: 8 }}><i style={{ display: "block", height: "100%", width: `${item.aiConfidence * 100}%`, background: "#73AB95", borderRadius: 4 }} /></div></> : <p className="muted" style={{ fontSize: 12, marginTop: 18 }}>This item was added {item.source.replace("_", " ")}.</p>}</section>
      <section className="card" style={{ padding: 22 }}><h2 className="section-title">Storefront status</h2><div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}><div className="empty-icon" style={{ margin: 0, width: 38, height: 38, background: listing?.isPublished ? "#F6F6F6" : "#f1f3f2" }}>{listing?.isPublished ? <Check size={18} /> : <Clock3 size={18} />}</div><div><strong style={{ fontSize: 13 }}>{listing?.isPublished ? "Published and visible" : listing ? "Draft awaiting approval" : "Inventory only"}</strong><p className="muted" style={{ fontSize: 11, margin: "4px 0 0" }}>{listing?.isPublished ? "Customers can order this product." : "Publish when the details are ready."}</p></div></div></section></aside></div>
    {correction && <section className="card" style={{ marginTop: 20, padding: 24 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Package size={18} color="#2C645B" /><h2 className="section-title">Human correction history</h2></div><p className="muted" style={{ fontSize: 12 }}>Your review changed the AI output before this product was saved.</p><div className="grid-2" style={{ marginTop: 16 }}><pre className="subtle-card" style={{ padding: 16, overflow: "auto", fontSize: 11 }}>{JSON.stringify(correction.original, null, 2)}</pre><pre className="subtle-card" style={{ padding: 16, overflow: "auto", fontSize: 11 }}>{JSON.stringify(correction.corrected, null, 2)}</pre></div></section>}
    <style jsx>{`
      .listing-editor { padding: 24px; margin-bottom: 20px; border-color: #73AB95; }
      .editor-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; margin-bottom: 22px; }
      .editor-header p { margin: 6px 0 0; color: #65777a; font-size: 12px; }
      .editor-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 20px; }
      @media (max-width: 650px) { .editor-header { flex-direction: column; } .editor-actions { display: grid; grid-template-columns: 1fr 1fr; } }
    `}</style>
  </div>;
}
