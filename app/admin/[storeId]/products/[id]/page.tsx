"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Bot, CheckCircle2, Edit3, LoaderCircle, Save, Store } from "lucide-react";
import { useApp } from "@/components/app-provider";

export default function AdminProductDetailPage() {
  const { storeId, id } = useParams<{ storeId: string; id: string }>();
  const router = useRouter();
  const { state, saveListing, updateInventory } = useApp();
  
  const item = state.inventory.find((entry) => entry.id === id);
  const itemStore = item ? state.stores.find((s) => s.id === item.businessId) : undefined;
  const listing = state.listings.find((entry) => entry.inventoryItemId === id);
  const correction = state.corrections.find((entry) => entry.inventoryItemId === id);
  
  const [listingForm, setListingForm] = useState({ title: "", description: "", price: "" });
  const [listingMessage, setListingMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (item) {
      setListingForm({
        title: listing?.title ?? item.name,
        description: listing?.description ?? item.description,
        price: String(listing?.price || item.price || ""),
      });
    }
  }, [item, listing]);

  if (!item && isClient) return <div className="page-wrap"><div className="empty"><h2>Product not found</h2><Link href={`/admin/${storeId}/inventory`} className="btn btn-primary">Back to inventory</Link></div></div>;
  if (!item) return null;

  const submitListing = async () => {
    setSaving(true);
    const result = await saveListing(item.id, {
      title: listingForm.title,
      description: listingForm.description,
      price: Number(listingForm.price),
    });

    if (result.ok) {
      router.push(`/admin/${storeId}/inventory`);
      return; // keep saving=true; page unmounts on navigation
    }
    setListingMessage(result.message);
    setTimeout(() => setListingMessage(""), 3000);
    setSaving(false);
  };

  return (
    <div style={{ paddingBottom: 100, background: "var(--canvas)", minHeight: "100vh" }}>
      <header className="glass" style={{ padding: "0 24px", height: 72, display: "flex", alignItems: "center", position: "sticky", top: 0, zIndex: 40, borderBottom: "1px solid var(--line)" }}>
        <Link href={`/admin/${storeId}/inventory`} className="btn btn-ghost" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back
        </Link>
      </header>

      <main className="animate-fade-in" style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px" }}>{item.name}</h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>{item.brand || "Unbranded"} · {item.category}</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {listing?.isPublished && (
              <Link href={`/shop/${itemStore?.slug ?? ""}`} className="btn btn-secondary shadow-soft">
                <Store size={16} /> View in store
              </Link>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ gridTemplateColumns: "1.3fr .7fr", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Main Product Edit Card */}
            <section className="card shadow-soft" style={{ padding: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 24 }}>Storefront details</h2>
              
              <div style={{ display: "grid", gap: 24 }}>
                <div style={{ position: "relative" }}>
                  <label style={{ position: "absolute", top: -8, left: 10, background: "var(--surface)", padding: "0 6px", fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Product Title</label>
                  <input className="input" style={{ paddingTop: 14, paddingBottom: 14 }} value={listingForm.title} onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })} />
                </div>
                
                <div style={{ position: "relative" }}>
                  <label style={{ position: "absolute", top: -8, left: 10, background: "var(--surface)", padding: "0 6px", fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Price (€)</label>
                  <input className="input" type="number" min="0" step="0.01" style={{ paddingTop: 14, paddingBottom: 14 }} value={listingForm.price} onChange={(e) => setListingForm({ ...listingForm, price: e.target.value })} />
                </div>
                
                <div style={{ position: "relative" }}>
                  <label style={{ position: "absolute", top: -8, left: 10, background: "var(--surface)", padding: "0 6px", fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Description</label>
                  <textarea className="input" style={{ minHeight: 120, paddingTop: 14 }} value={listingForm.description} onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })} />
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Product image */}
            {item.imageUrl && (
              <section className="card shadow-soft" style={{ overflow: "hidden" }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </section>
            )}

            {/* Status Card */}
            <section className="card shadow-soft" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 16 }}>Status</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: listing?.isPublished ? "var(--brand)" : "var(--amber)" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{listing?.isPublished ? "Published online" : "Draft (Not visible)"}</span>
              </div>

              <div style={{ height: 1, background: "var(--line)", marginBottom: 20 }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 13, color: "var(--muted)", display: "block", marginBottom: 4 }}>Inventory stock</span>
                  <strong style={{ fontSize: 15, color: "var(--ink)" }}>{item.quantity} {item.unit}</strong>
                  {item.quantity <= item.lowStockThreshold && <span style={{ fontSize: 12, color: "var(--amber)", display: "block", marginTop: 4 }}>Low stock</span>}
                </div>
                <button className="btn btn-ghost" style={{ padding: "8px" }} onClick={() => { 
                  const quantity = prompt("Update quantity", String(item.quantity)); 
                  if (quantity !== null && Number(quantity) >= 0) updateInventory(item.id, { quantity: Number(quantity) }); 
                }}>
                  <Edit3 size={16} color="var(--muted)" />
                </button>
              </div>
            </section>

            {/* AI Source subtle badge */}
            {item.source === "ai_scan" && (
              <section className="card shadow-soft" style={{ padding: 20, background: "var(--brand-soft)", border: "1px solid var(--brand)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Bot size={18} color="var(--brand)" style={{ marginTop: 2 }} />
                <div>
                  <strong style={{ fontSize: 13, color: "var(--brand)", display: "block", marginBottom: 4 }}>AI-Assisted Scan</strong>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    Details were extracted from a scan with {Math.round(item.aiConfidence! * 100)}% confidence.
                  </p>
                </div>
              </section>
            )}
            
            {correction && (
              <section className="card shadow-soft" style={{ padding: 20, background: "var(--brand-soft)", border: "1px solid var(--amber)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div>
                  <strong style={{ fontSize: 13, color: "#92400E", display: "block", marginBottom: 4 }}>Human Corrected</strong>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                    AI output was modified before saving.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="glass" style={{ position: "fixed", bottom: 0, left: 240, right: 0, borderTop: "1px solid var(--line)", padding: "16px 40px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, zIndex: 40, background: "rgba(255, 255, 255, 0.9)" }}>
        {listingMessage && (
          <span className="animate-fade-in" style={{ color: listingMessage === "Storefront listing updated." ? "var(--brand)" : "var(--danger)", fontSize: 14, fontWeight: 600 }}>
            {listingMessage}
          </span>
        )}
        <button className="btn btn-primary shadow-glow" onClick={submitListing} disabled={saving} style={{ minHeight: 44, padding: "0 24px", fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving
            ? <><LoaderCircle size={16} style={{ animation: "prod-spin 1s linear infinite" }} />Saving…</>
            : <><Save size={16} /> Save & publish</>}
        </button>
        <style>{`@keyframes prod-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
