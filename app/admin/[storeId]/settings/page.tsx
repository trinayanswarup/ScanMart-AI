"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useApp } from "@/components/app-provider";

export default function AdminSettingsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { state, getStore, updateBusiness, resetDemo } = useApp();
  const router = useRouter();
  const store = getStore(storeId);

  const [name, setName] = useState(store?.name ?? "");
  const [slug, setSlug] = useState(store?.slug ?? "");
  const [threshold, setThreshold] = useState(store?.lowStockThreshold ?? 3);
  const [saved, setSaved] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleReset = async () => {
    setResetting(true);
    setResetError("");
    setConfirming(false);
    try {
      await resetDemo();
      router.push(`/admin/${storeId}/dashboard`);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Reset failed. Is the backend running?");
      setResetting(false);
    }
  };

  return (
    <div className="page-wrap" style={{ maxWidth: 920 }}>
      {resetting && (
        <div style={{ position: "fixed", inset: 0, background: "var(--canvas)", display: "grid", placeItems: "center", zIndex: 100 }}>
          <style>{`@keyframes reset-spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ textAlign: "center" }}>
            <LoaderCircle size={56} color="var(--brand)" style={{ animation: "reset-spin 1s linear infinite" }} />
            <p style={{ marginTop: 20, color: "var(--ink)", fontSize: 18, fontWeight: 700, margin: "20px 0 8px" }}>Resetting workspace…</p>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>This may take a few seconds</p>
          </div>
        </div>
      )}
      <div className="page-header"><div><h1>Business settings</h1><p>Manage storefront identity and inventory defaults.</p></div></div>

      <section className="card" style={{ padding: 26 }}>
        <h2 className="section-title">Store profile</h2>
        <div className="form-grid" style={{ marginTop: 20 }}>
          <div><label className="label">Store name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">Business type</label><input className="input" value={store?.businessType ?? ""} disabled style={{ textTransform: "capitalize", background: "var(--canvas)" }} /></div>
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
        <h2 className="section-title" style={{ marginBottom: 6 }}>Switch to a different store</h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 20 }}>Navigate to another store&apos;s admin panel.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {state.stores.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/admin/${s.id}/dashboard`)}
              style={{
                border: s.id === storeId ? "2px solid var(--brand)" : "1px solid var(--line)",
                borderRadius: 8, padding: "16px 14px",
                background: s.id === storeId ? "var(--brand-soft)" : "var(--surface)",
                cursor: "pointer", textAlign: "left", transition: ".15s",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#65777a", marginTop: 4, textTransform: "capitalize" }}>{s.businessType}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 26, marginTop: 20, borderColor: "rgba(239, 68, 68, 0.3)" }}>
        <h2 className="section-title">Reset workspace</h2>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          Wipes all inventory, orders, listings, and workflow executions across all three stores and restores the original demo data. This cannot be undone.
        </p>

        {resetError && (
          <div className="error-text" style={{ marginBottom: 16 }}>{resetError}</div>
        )}

        {confirming ? (
          <div className="card" style={{ padding: 20, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.3)", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
              <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: 14, color: "var(--ink)", display: "block", marginBottom: 4 }}>This will permanently delete all changes.</strong>
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>All products, orders, and workflow executions added during testing will be removed. Are you sure?</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-danger" onClick={() => void handleReset()} disabled={resetting}>
                <RotateCcw size={16} />Yes, reset everything
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirming(true)} disabled={resetting}>
            <RotateCcw size={16} />Reset workspace
          </button>
        )}
      </section>
    </div>
  );
}
