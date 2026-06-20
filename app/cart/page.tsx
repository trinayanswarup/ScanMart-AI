"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useApp } from "@/components/app-provider";
import { checkoutSchema } from "@/lib/validation";

export default function CartPage() {
  const { state, setCartQuantity, placeOrder } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "" });
  const [error, setError] = useState("");
  const details = state.cart.flatMap((cartItem) => { const listing = state.listings.find((item) => item.id === cartItem.listingId); return listing ? [{ ...cartItem, listing }] : []; });
  const total = details.reduce((sum, item) => sum + item.listing.price * item.quantity, 0);
  const checkout = () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your details."); return; }
    const id = placeOrder(parsed.data);
    router.push(`/order-confirmation/${id}`);
  };
  return <div style={{ minHeight: "100vh", background: "#fafbf9" }}><header style={{ height: 74, padding: "0 24px", maxWidth: 1120, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}><Logo /><Link href={`/store/${state.business.slug}`} className="btn btn-ghost"><ArrowLeft size={16} />Continue shopping</Link></header><main style={{ maxWidth: 1050, margin: "30px auto", padding: "0 20px 70px" }}><div className="page-header"><div><h1>Checkout</h1><p>Review your order request for {state.business.name}.</p></div></div>
    {details.length ? <div className="grid-2" style={{ gridTemplateColumns: "1.15fr .85fr" }}><section className="card" style={{ padding: 24 }}><h2 className="section-title">Your items</h2><div style={{ marginTop: 14 }}>{details.map(({ listing, quantity }) => <div key={listing.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 14, padding: "16px 0", borderBottom: "1px solid #e8ece9" }}><div style={{ width: 60, height: 68, borderRadius: 5, background: "#edf3ef", color: "#2C645B", display: "grid", placeItems: "center", fontWeight: 900 }}>{listing.title[0]}</div><div><strong style={{ fontSize: 14 }}>{listing.title}</strong><span className="muted" style={{ display: "block", fontSize: 11, marginTop: 6 }}>₹{listing.price} each</span><div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}><button className="btn btn-secondary" style={{ minHeight: 28, padding: "0 7px" }} onClick={() => setCartQuantity(listing.id, quantity - 1)}><Minus size={12} /></button><b style={{ fontSize: 12 }}>{quantity}</b><button className="btn btn-secondary" style={{ minHeight: 28, padding: "0 7px" }} onClick={() => setCartQuantity(listing.id, quantity + 1)}><Plus size={12} /></button></div></div><strong>₹{listing.price * quantity}</strong></div>)}</div></section>
      <aside className="card" style={{ padding: 24 }}><h2 className="section-title">Contact details</h2><p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>The seller will use these details to confirm pickup or delivery.</p><div style={{ display: "grid", gap: 15, marginTop: 20 }}><div><label className="label">Full name *</label><input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div><div><label className="label">Phone number</label><input className="input" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></div><div><label className="label">Email</label><input className="input" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></div></div><div className="subtle-card" style={{ padding: 15, marginTop: 20 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Order total</span><strong style={{ fontSize: 20 }}>₹{total}</strong></div><p className="muted" style={{ fontSize: 10, margin: "8px 0 0" }}>Pay at pickup / cash on delivery. No online payment required.</p></div>{error && <div className="error-text">{error}</div>}<button className="btn btn-primary" style={{ width: "100%", marginTop: 18 }} onClick={checkout}><CheckCircle2 size={16} />Place order request</button></aside></div> : <div className="card empty"><div className="empty-icon"><ShoppingBag /></div><h2>Your cart is empty</h2><Link href={`/store/${state.business.slug}`} className="btn btn-primary">Browse the store</Link></div>}
  </main></div>;
}

