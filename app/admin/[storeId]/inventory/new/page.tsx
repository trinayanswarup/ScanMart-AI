"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { inventorySchema } from "@/lib/validation";
import { getCategoryTemplates } from "@/lib/seed";

export default function AdminNewInventoryPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { getStore, addInventory } = useApp();
  const store = getStore(storeId);
  const cats = getCategoryTemplates(store?.businessType ?? "salon");

  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", brand: "", category: cats[0] ?? "Other", description: "", quantity: 1, unit: "pcs", price: "", lowStockThreshold: store?.lowStockThreshold ?? 3 });
  const set = (key: string, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    const parsed = inventorySchema.safeParse({ ...form, price: form.price ? Number(form.price) : undefined });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check the product details."); return; }
    const id = addInventory(storeId, { ...parsed.data, source: "manual", status: "active" });
    router.push(`/admin/${storeId}/products/${id}`);
  };
  return <div className="page-wrap" style={{ maxWidth: 900 }}><Link href={`/admin/${storeId}/inventory`} className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 14 }}><ArrowLeft size={16} />Back to inventory</Link><div className="page-header"><div><h1>Add product manually</h1><p>Create an inventory record with the details you already know.</p></div></div>
    <div className="card" style={{ padding: 28 }}><div className="form-grid"><div><label className="label">Product name *</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Hydrating shampoo" /></div><div><label className="label">Brand</label><input className="input" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Optional" /></div><div><label className="label">Category *</label><select className="select" value={form.category} onChange={(e) => set("category", e.target.value)}>{cats.map((item) => <option key={item}>{item}</option>)}<option>Other</option></select></div><div><label className="label">Price (₹)</label><input className="input" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Required before publishing" /></div><div><label className="label">Quantity *</label><input className="input" type="number" value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} /></div><div><label className="label">Unit *</label><select className="select" value={form.unit} onChange={(e) => set("unit", e.target.value)}>{["pcs", "packs", "kg", "g", "litres", "ml", "boxes"].map((item) => <option key={item}>{item}</option>)}</select></div><div><label className="label">Low-stock threshold</label><input className="input" type="number" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", Number(e.target.value))} /></div></div><div style={{ marginTop: 18 }}><label className="label">Description *</label><textarea className="textarea" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="A concise description for inventory and storefront use." /></div>{error && <div className="error-text">{error}</div>}<div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}><Link href={`/admin/${storeId}/inventory`} className="btn btn-secondary">Cancel</Link><button className="btn btn-primary" onClick={submit}><Save size={16} />Save product</button></div></div>
  </div>;
}
