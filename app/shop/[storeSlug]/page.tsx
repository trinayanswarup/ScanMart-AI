"use client";

import Link from "next/link";
import { Check, CheckCircle2, Minus, Plus, Search, ShoppingBag, Sparkles, Store, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Logo } from "@/components/logo";
import { useApp } from "@/components/app-provider";

const getStoreGradient = (type: string) => {
  if (type === "salon") return "linear-gradient(135deg, #1E293B, #0F172A)";
  if (type === "cafe") return "linear-gradient(135deg, #78350F, #451A03)";
  if (type === "grocery") return "linear-gradient(135deg, #064E3B, #022C22)";
  return "linear-gradient(135deg, #2C645B, #1E4942)";
};

const FallbackImage = ({ seed }: { seed: string }) => {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #E0F2E9, #F4F7F5)", display: "grid", placeItems: "center" }}>
       <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
         <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
         <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
         <line x1="12" y1="22.08" x2="12" y2="12"></line>
       </svg>
    </div>
  );
};

export default function ShopStorefrontPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { state, addToCart, setCartQuantity } = useApp();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const store = state.stores.find((s) => s.slug === storeSlug);
  if (!store && isClient) return <div className="empty"><h2>Store not found</h2><Link href="/shop" className="btn btn-primary">Browse stores</Link></div>;
  if (!store) return null; // Wait for hydration

  const storeListings = state.listings.filter((l) => l.businessId === store.id);
  const storeInv = state.inventory.filter((i) => i.businessId === store.id);

  const categories = ["All", ...new Set(storeListings.filter((l) => l.isPublished).map((l) => storeInv.find((i) => i.id === l.inventoryItemId)?.category).filter(Boolean) as string[])];
  const products = useMemo(() => storeListings.filter((listing) => {
    const item = storeInv.find((entry) => entry.id === listing.inventoryItemId);
    return listing.isPublished && item && item.quantity > 0 && (category === "All" || item.category === category) && listing.title.toLowerCase().includes(search.toLowerCase());
  }), [storeListings, storeInv, category, search]);

  const storeCart = state.cart.filter((c) => c.storeId === store.id);
  const total = storeCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
    <header className="glass" style={{ height: 72, maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
      <Logo />
      <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
        <Link href="/shop" style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>All stores</Link>
        <button onClick={() => setDrawer(true)} className="btn btn-primary shadow-glow" style={{ position: "relative" }}>
          <ShoppingBag size={16} /> Cart
          {storeCart.length > 0 && (
            <span style={{ position: "absolute", top: -6, right: -6, background: "var(--danger)", color: "white", width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, border: "2px solid var(--surface)" }}>
              {storeCart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </nav>
    </header>
    
    <section className="animate-fade-in" style={{ maxWidth: 1200, margin: "20px auto 0", background: getStoreGradient(store.businessType), color: "white", borderRadius: 16, padding: "60px 80px", display: "flex", alignItems: "center", justifyContent: "space-between", overflow: "hidden", position: "relative", boxShadow: "0 24px 50px rgba(4, 26, 21, 0.12)" }}>
      <div style={{ position: "relative", zIndex: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.7)", display: "flex", gap: 8, alignItems: "center", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>
          <Store size={14} /> Local pickup available
        </span>
        <h1 style={{ fontSize: 52, letterSpacing: "-.04em", margin: "0 0 12px", fontWeight: 800 }}>{store.name}</h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, maxWidth: 500 }}>Browse our carefully selected products, available for local pickup today.</p>
        <div style={{ display: "flex", gap: 24, marginTop: 32, color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 600 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color="#7CD4AC" /> Pay at pickup</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color="#7CD4AC" /> Local service</span>
        </div>
      </div>
      <div style={{ width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", display: "grid", placeItems: "center", fontSize: 64, fontWeight: 900, boxShadow: "0 0 0 40px rgba(255,255,255,0.02)", position: "absolute", right: 60 }}>
        {store.name.charAt(0)}
      </div>
    </section>
    
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div className="animate-slide-up delay-100" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 40, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((item) => (
             <button key={item} onClick={() => setCategory(item)} style={{ background: category === item ? "var(--ink)" : "white", color: category === item ? "white" : "var(--muted)", border: category === item ? "1px solid var(--ink)" : "1px solid var(--line)", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, transition: ".2s" }}>
               {item}
             </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--line)", background: "white", borderRadius: 8, padding: "0 14px", width: "100%", maxWidth: 300, boxShadow: "0 2px 8px rgba(4, 26, 21, 0.02)" }}>
          <Search size={16} color="var(--muted)" />
          <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: 0, outline: 0, background: "transparent", height: 42, width: "100%", fontSize: 14 }} />
        </div>
      </div>
      
      <div className="animate-slide-up delay-200" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, margin: 0, letterSpacing: "-.03em", color: "var(--ink)", fontWeight: 800 }}>Shop products</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: "4px 0 0" }}>{products.length} items available</p>
      </div>
      
      {products.length ? <div className="grid-4 animate-slide-up delay-300">
        {products.map((listing, index) => { 
          const item = storeInv.find((entry) => entry.id === listing.inventoryItemId)!; 
          return (
            <article className="card shadow-soft" key={listing.id} style={{ display: "flex", flexDirection: "column", overflow: "hidden", transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)" }}
                 onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(4, 26, 21, 0.08)"; }}
                 onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-soft)"; }}>
              <div style={{ height: 240, position: "relative", background: "#F4F7F5" }}>
                {item.imageUrl?.startsWith("data:") ? <img src={item.imageUrl} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FallbackImage seed={listing.id} />}
                {item.quantity < 5 && <span className="badge badge-amber" style={{ position: "absolute", top: 12, right: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>Only {item.quantity} left</span>}
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{ color: "var(--brand)", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{item.category}</span>
                <h3 style={{ fontSize: 16, margin: "8px 0", color: "var(--ink)", fontWeight: 700, lineHeight: 1.4 }}>{listing.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, flex: 1, marginBottom: 20, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{listing.description}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <strong style={{ fontSize: 22, color: "var(--ink)", fontWeight: 800 }}>€{listing.price}</strong>
                </div>
                <button className="btn btn-primary shadow-glow" style={{ width: "100%", padding: "0" }} onClick={() => { addToCart(listing.id); setDrawer(true); }}>
                  <Plus size={16} /> Add to cart
                </button>
              </div>
            </article>
          )})}
      </div> : <div className="card shadow-soft empty animate-slide-up"><div className="empty-icon"><Search /></div><h3 style={{ fontSize: 20, color: "var(--ink)", fontWeight: 700 }}>No matching products</h3><p className="muted">Try another category or search term.</p></div>}
    </main>
    
    <section className="animate-fade-in" style={{ maxWidth: 1200, margin: "0 auto 60px", background: "white", border: "1px solid var(--line)", borderRadius: 12, padding: "24px", display: "flex", gap: 16, alignItems: "center", color: "var(--brand)", boxShadow: "0 4px 20px rgba(4, 26, 21, 0.02)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--brand-soft)", display: "grid", placeItems: "center" }}><Sparkles size={24} /></div>
      <div>
        <strong style={{ fontSize: 15, color: "var(--ink)" }}>Powered by ScanMart AI</strong>
        <span style={{ display: "block", fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Product information is reviewed by the seller before publishing.</span>
      </div>
    </section>
    
    {drawer && <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <button className="animate-fade-in" style={{ position: "absolute", inset: 0, background: "rgba(4, 26, 21, 0.4)", backdropFilter: "blur(4px)", border: 0 }} onClick={() => setDrawer(false)} />
      <aside className="animate-slide-up" style={{ position: "relative", width: "100%", maxWidth: 440, background: "var(--canvas)", display: "flex", flexDirection: "column", boxShadow: "-20px 0 50px rgba(4, 26, 21, 0.15)", height: "100%" }}>
        <div className="glass" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
          <div><h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>Your Cart</h2><span style={{ fontSize: 13, color: "var(--muted)" }}>{storeCart.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
          <button style={{ border: 0, background: "white", borderRadius: 8, width: 40, height: 40, display: "grid", placeItems: "center", color: "var(--muted)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} onClick={() => setDrawer(false)}><X size={20} /></button>
        </div>
        
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {storeCart.length ? storeCart.map((cartItem) => (
            <div className="card shadow-soft" key={cartItem.listingId} style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 16, padding: 16, alignItems: "center" }}>
              <div style={{ width: 70, height: 70, borderRadius: 8, background: "var(--brand-soft)", display: "grid", placeItems: "center", color: "var(--brand)", fontWeight: 800 }}>
                {cartItem.productName.slice(0, 1)}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                   <strong style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.4, paddingRight: 10 }}>{cartItem.productName}</strong>
                   <strong style={{ fontSize: 15, color: "var(--ink)" }}>€{cartItem.price * cartItem.quantity}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ fontSize: 12, color: "var(--muted)" }}>€{cartItem.price} each</span>
                   <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--line)", borderRadius: 6, background: "white" }}>
                      <button style={{ border: 0, background: "transparent", width: 28, height: 28, display: "grid", placeItems: "center", color: "var(--muted)" }} onClick={() => setCartQuantity(cartItem.listingId, cartItem.quantity - 1)}><Minus size={12} /></button>
                      <b style={{ width: 28, height: 28, display: "grid", placeItems: "center", fontSize: 12, background: "var(--brand-soft)", color: "var(--ink)" }}>{cartItem.quantity}</b>
                      <button style={{ border: 0, background: "transparent", width: 28, height: 28, display: "grid", placeItems: "center", color: "var(--muted)" }} onClick={() => setCartQuantity(cartItem.listingId, cartItem.quantity + 1)}><Plus size={12} /></button>
                   </div>
                </div>
              </div>
            </div>
          )) : <div className="empty" style={{ paddingTop: 60 }}><ShoppingBag size={40} color="var(--brand)" style={{ opacity: 0.2, margin: "0 auto 16px" }} /><p style={{ fontSize: 16, color: "var(--ink)", fontWeight: 600 }}>Your cart is empty.</p></div>}
        </div>
        
        {storeCart.length > 0 && (
          <div className="glass" style={{ borderTop: "1px solid var(--line)", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 600 }}>Subtotal</span>
              <strong style={{ fontSize: 24, color: "var(--ink)", fontWeight: 800 }}>€{total}</strong>
            </div>
            <Link href="/cart" className="btn btn-primary shadow-glow" style={{ width: "100%", minHeight: 52, fontSize: 16 }} onClick={() => setDrawer(false)}>
              Checkout securely
            </Link>
            <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", margin: "16px 0 0" }}>Pay securely at pickup. No online payment required.</p>
          </div>
        )}
      </aside>
    </div>}
  </div>;
}
