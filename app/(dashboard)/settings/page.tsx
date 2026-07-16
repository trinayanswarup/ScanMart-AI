"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { useApp } from "@/components/app-provider";

export default function SettingsPage() {
  const { state, currentStoreId, setCurrentStoreId, getStore, updateBusiness, resetDemo } = useApp();
  const storeId = currentStoreId ?? state.stores[0]?.id ?? "";
  const store = getStore(storeId);

  const [name, setName] = useState(store?.name ?? "");
  const [slug, setSlug] = useState(store?.slug ?? "");
  const [threshold, setThreshold] = useState(store?.lowStockThreshold ?? 3);
  const [saved, setSaved] = useState(false);

  return (
    <div className="page-wrap" style={{ maxWidth: 920 }}>
      <div className="page-header"><div><h1>Business settings</h1><p>Manage storefront identity and inventory defaults.</p></div></div>

      <section className="card" style={{ padding: 26 }}>
        <h2 className="section-title">Store profile</h2>
        <div className="form-grid" style={{ marginTop: 20 }}>
          <div><label className="label">Store name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Business type</label><input className="input" value={store?.businessType ?? ""} disabled style={{ textTransform: "capitalize", background: "#f5f7f5" }} /></div>
          <div><label className="label">Storefront slug</label><input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
          <div><label className="label">Default low-stock threshold</label><input className="input" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></div>
        </div>
        {saved && <div className="notice" style={{ marginTop: 18 }}>Settings saved.</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
          <button className="btn btn-primary" onClick={() => { updateBusiness(storeId, { name, slug, lowStockThreshold: threshold }); setSaved(true); }}>
            <Save size={16} />Save changes
          </button>
        </div>
      </section>

      <section className="card" style={{ padding: 26, marginTop: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 6 }}>Manage a different store</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>Switch which store you are currently managing in the admin dashboard.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {state.stores.map((s) => (
            <button
              key={s.id}
              onClick={() => { setCurrentStoreId(s.id); setSaved(false); setName(s.name); setSlug(s.slug); setThreshold(s.lowStockThreshold); }}
              style={{
                border: s.id === storeId ? "2px solid #2C645B" : "1px solid #e1e9e9",
                borderRadius: 8, padding: "16px 14px",
                background: s.id === storeId ? "#F0FAF5" : "white",
                cursor: "pointer", textAlign: "left", transition: ".15s",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#65777a", marginTop: 4, textTransform: "capitalize" }}>{s.businessType}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 26, marginTop: 20, borderColor: "#f0d8d5" }}>
        <h2 className="section-title">Demo data</h2>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>Reset all stores to the original demo state.</p>
        <button className="btn btn-danger" onClick={() => { if (confirm("Reset all demo changes?")) { resetDemo(); location.reload(); } }}>
          <RotateCcw size={16} />Reset demo workspace
        </button>
      </section>
    </div>
  );
}
