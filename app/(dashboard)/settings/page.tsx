"use client";

import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { useApp } from "@/components/app-provider";

export default function SettingsPage() {
  const { state, updateBusiness, resetDemo } = useApp();
  const [name, setName] = useState(state.business.name);
  const [slug, setSlug] = useState(state.business.slug);
  const [threshold, setThreshold] = useState(state.business.lowStockThreshold);
  const [saved, setSaved] = useState(false);
  return <div className="page-wrap" style={{ maxWidth: 920 }}><div className="page-header"><div><h1>Business settings</h1><p>Manage storefront identity and inventory defaults.</p></div></div>
    <section className="card" style={{ padding: 26 }}><h2 className="section-title">Business profile</h2><div className="form-grid" style={{ marginTop: 20 }}><div><label className="label">Business name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div><div><label className="label">Business type</label><input className="input" value={state.business.businessType} disabled style={{ textTransform: "capitalize", background: "#f5f7f5" }} /></div><div><label className="label">Storefront slug</label><input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} /></div><div><label className="label">Default low-stock threshold</label><input className="input" type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></div></div>
      {saved && <div className="notice" style={{ marginTop: 18 }}>Settings saved to this demo workspace.</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}><button className="btn btn-primary" onClick={() => { updateBusiness({ name, slug, lowStockThreshold: threshold }); setSaved(true); }}><Save size={16} />Save changes</button></div></section>
    <section className="card" style={{ padding: 26, marginTop: 20, borderColor: "#f0d8d5" }}><h2 className="section-title">Demo data</h2><p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>Reset inventory, orders, listings, and automation runs to the original Urban Glow Salon demo.</p><button className="btn btn-danger" onClick={() => { if (confirm("Reset all demo changes?")) { resetDemo(); location.reload(); } }}><RotateCcw size={16} />Reset demo workspace</button></section>
  </div>;
}
