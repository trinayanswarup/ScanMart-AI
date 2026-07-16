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

  // CartItem is now denormalized — no need to look up listings
  const details = state.cart;
  const total = details.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // For the "continue shopping" link, use the first store in the cart (or fallback to first store)
  const shoppingStore = state.cart[0]
    ? state.stores.find((s) => s.id === state.cart[0].storeId)
    : state.stores[0];

  const checkout = () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your details."); return; }
    const ids = placeOrder(parsed.data);
    if (ids.length > 0) router.push(`/order-confirmation/${ids[0]}`);
  };

  return <div style={{ minHeight: "100vh", background: "#fafbf9" }}>
    <header style={{ height: 74, padding: "0 24px", maxWidth: 1120, margin: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Logo />
      <Link href={shoppingStore ? `/store/${shoppingStore.slug}` : "/"} className="btn btn-ghost"><ArrowLeft size={16} />Continue shopping</Link>
    </header>
    <main style={{ maxWidth: 1050, margin: "30px auto", padding: "0 20px 70px" }}>
      <div className="page-header"><div><h1>Checkout</h1><p>Review your order before confirming.</p></div></div>
      {details.length ? <div className="grid-2" style={{ gridTemplateColumns: "1.15fr .85fr" }}>
        <section className="card" style={{ padding: 24 }}>
          <h2 className="section-title">Your items</h2>
          <div style={{ marginTop: 14 }}>
            {details.map((item) => (
              <div key={item.listingId} style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 14, padding: "16px 0", borderBottom: "1px solid #e8ece9" }}>
                <div style={{ width: 60, height: 68, borderRadius: 5, background: "#edf3ef", color: "#2C645B", display: "grid", placeItems: "center", fontWeight: 900 }}>{item.productName[0]}</div>
                <div>
                  <strong style={{ fontSize: 14 }}>{item.productName}</strong>
                  <span className="muted" style={{ display: "block", fontSize: 11, marginTop: 4 }}>₹{item.price} each · {item.storeName}</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
                    <button className="btn btn-secondary" style={{ minHeight: 28, padding: "0 7px" }} onClick={() => setCartQuantity(item.listingId, item.quantity - 1)}><Minus size={12} /></button>
                    <b style={{ fontSize: 12 }}>{item.quantity}</b>
                    <button className="btn btn-secondary" style={{ minHeight: 28, padding: "0 7px" }} onClick={() => setCartQuantity(item.listingId, item.quantity + 1)}><Plus size={12} /></button>
                  </div>
                </div>
                <strong>₹{item.price * item.quantity}</strong>
              </div>
            ))}
          </div>
        </section>
        <aside className="card" style={{ padding: 24 }}>
          <h2 className="section-title">Contact details</h2>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>The seller will use these details to confirm pickup or delivery.</p>
          <div style={{ display: "grid", gap: 15, marginTop: 20 }}>
            <div><label className="label">Full name *</label><input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
            <div><label className="label">Phone number</label><input className="input" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></div>
          </div>
          <div className="subtle-card" style={{ padding: 15, marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Order total</span><strong style={{ fontSize: 20 }}>₹{total}</strong></div>
            <p className="muted" style={{ fontSize: 10, margin: "8px 0 0" }}>Pay at pickup / cash on delivery. No online payment required.</p>
          </div>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 18 }} onClick={checkout}><CheckCircle2 size={16} />Place order request</button>
        </aside>
      </div> : <div className="card empty"><div className="empty-icon"><ShoppingBag /></div><h2>Your cart is empty</h2><Link href={state.stores[0] ? `/store/${state.stores[0].slug}` : "/"} className="btn btn-primary">Browse the store</Link></div>}
    </main>
  </div>;
}
