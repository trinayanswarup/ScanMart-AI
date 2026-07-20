"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Search, ShieldCheck, ShoppingBag, Plus, Minus, X } from "lucide-react";
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

  const details = state.cart;
  const total = details.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const shoppingStore = state.cart[0]
    ? state.stores.find((s) => s.id === state.cart[0].storeId)
    : state.stores[0];

  const checkout = () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your details."); return; }
    const ids = placeOrder(parsed.data);
    if (ids.length > 0) router.push(`/order-confirmation/${ids[0]}`);
  };

  return <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
    <header className="glass" style={{ height: 74, padding: "0 24px", maxWidth: 1200, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
      <Logo />
      <Link href={shoppingStore ? `/shop/${shoppingStore.slug}` : "/shop"} className="btn btn-ghost"><ArrowLeft size={16} />Continue shopping</Link>
    </header>
    <main className="animate-fade-in" style={{ maxWidth: 1100, margin: "40px auto", padding: "0 24px 80px" }}>
      <div className="page-header" style={{ marginBottom: 40 }}><div><h1 style={{ fontSize: 42, color: "var(--ink)", fontWeight: 800 }}>Secure Checkout</h1><p style={{ fontSize: 16 }}>Review your items and confirm your details.</p></div></div>
      
      {details.length ? <div className="grid-2" style={{ gridTemplateColumns: "1.2fr 0.8fr", alignItems: "start", gap: 32 }}>
        
        {/* Cart Items List */}
        <section className="card shadow-soft" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 16 }}>
            <ShoppingBag size={20} color="var(--brand)" />
            <h2 className="section-title">Your Order ({details.reduce((s,i) => s + i.quantity, 0)} items)</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {details.map((item) => (
              <div key={item.listingId} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 18, alignItems: "center" }}>
                {/* Abstract Pattern Fallback Image */}
                <div style={{ width: 70, height: 70, borderRadius: 8, background: "linear-gradient(135deg, #E0F2E9, #F4F7F5)", border: "1px solid var(--line)", display: "grid", placeItems: "center" }}>
                   <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--brand)", opacity: 0.1 }} />
                </div>
                <div>
                  <strong style={{ fontSize: 16, color: "var(--ink)" }}>{item.productName}</strong>
                  <span className="muted" style={{ display: "block", fontSize: 13, marginTop: 4 }}>€{item.price} each · {item.storeName}</span>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
                    <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden", background: "var(--surface)" }}>
                      <button style={{ border: 0, background: "transparent", width: 32, height: 32, display: "grid", placeItems: "center", color: "var(--muted)" }} onClick={() => setCartQuantity(item.listingId, item.quantity - 1)}><Minus size={14} /></button>
                      <b style={{ width: 32, height: 32, display: "grid", placeItems: "center", fontSize: 13, background: "var(--brand-soft)", color: "var(--ink)" }}>{item.quantity}</b>
                      <button style={{ border: 0, background: "transparent", width: 32, height: 32, display: "grid", placeItems: "center", color: "var(--muted)" }} onClick={() => setCartQuantity(item.listingId, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
                <strong style={{ fontSize: 18, color: "var(--ink)" }}>€{item.price * item.quantity}</strong>
              </div>
            ))}
          </div>
        </section>
        
        {/* Checkout Form & Totals */}
        <div style={{ position: "sticky", top: 100 }}>
          <aside className="card shadow-glow" style={{ padding: 32, border: "2px solid var(--brand-soft)" }}>
            <h2 className="section-title" style={{ marginBottom: 24 }}>Pickup Details</h2>
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <label className="label" style={{ position: "absolute", top: -8, left: 10, background: "var(--surface)", padding: "0 6px", fontSize: 11, color: "var(--brand)" }}>Full Name</label>
                <input className="input" style={{ paddingTop: 14, paddingBottom: 14 }} placeholder="John Doe" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </div>
              <div style={{ position: "relative" }}>
                <label className="label" style={{ position: "absolute", top: -8, left: 10, background: "var(--surface)", padding: "0 6px", fontSize: 11, color: "var(--brand)" }}>Phone Number</label>
                <input className="input" style={{ paddingTop: 14, paddingBottom: 14 }} placeholder="+91 99999 99999" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
              </div>
              <div style={{ position: "relative" }}>
                <label className="label" style={{ position: "absolute", top: -8, left: 10, background: "var(--surface)", padding: "0 6px", fontSize: 11, color: "var(--brand)" }}>Email (Optional)</label>
                <input className="input" style={{ paddingTop: 14, paddingBottom: 14 }} type="email" placeholder="john@example.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
              </div>
            </div>
            
            <div style={{ background: "var(--canvas)", padding: 20, borderRadius: 8, marginTop: 32, border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "var(--muted)", fontSize: 14 }}><span>Subtotal</span><span>€{total}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "var(--muted)", fontSize: 14 }}><span>Taxes</span><span>Calculated at store</span></div>
              <div style={{ height: 1, background: "var(--line)", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 700, color: "var(--ink)", fontSize: 16 }}>Total to pay</span><strong style={{ fontSize: 26, color: "var(--ink)", fontWeight: 800 }}>€{total}</strong></div>
            </div>
            
            <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--brand)", fontSize: 12, fontWeight: 600, marginTop: 24, justifyContent: "center" }}>
               <ShieldCheck size={16} /> Pay securely at pickup. No card required.
            </div>
            
            {error && <div className="error-text" style={{ textAlign: "center", marginTop: 16 }}>{error}</div>}
            
            <button className="btn btn-primary shadow-glow" style={{ width: "100%", marginTop: 20, minHeight: 52, fontSize: 16, borderRadius: 8 }} onClick={checkout}>
              <CheckCircle2 size={18} /> Confirm Order Request
            </button>
          </aside>
        </div>
      </div> : 
      
      <div className="card shadow-soft empty animate-slide-up" style={{ padding: "80px 20px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
           <ShoppingBag size={32} />
        </div>
        <h2 style={{ fontSize: 28, color: "var(--ink)", fontWeight: 800, margin: "0 0 10px" }}>Your cart is empty</h2>
        <p style={{ color: "var(--muted)", fontSize: 16, margin: "0 0 30px" }}>Looks like you haven't added anything to your cart yet.</p>
        <Link href={state.stores[0] ? `/shop/${state.stores[0].slug}` : "/shop"} className="btn btn-primary shadow-glow" style={{ padding: "0 32px", minHeight: 48, fontSize: 15 }}>
          Start Shopping
        </Link>
      </div>}
    </main>
  </div>;
}
