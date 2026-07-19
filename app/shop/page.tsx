"use client";

import Link from "next/link";
import { Search, ShoppingBag, Store } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Logo } from "@/components/logo";

const getStoreGradient = (type: string) => {
  if (type === "salon") return "linear-gradient(135deg, #1E293B, #0F172A)";
  if (type === "cafe") return "linear-gradient(135deg, #78350F, #451A03)";
  if (type === "grocery") return "linear-gradient(135deg, #064E3B, #022C22)";
  return "linear-gradient(135deg, #2C645B, #1E4942)";
};

export default function ShopIndexPage() {
  const { state } = useApp();
  
  const totalCartItems = state.cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <header className="glass" style={{ height: 72, maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
        <Logo />
        <Link href="/cart" className="btn btn-primary shadow-glow" style={{ position: "relative" }}>
          <ShoppingBag size={16} /> Cart
          {totalCartItems > 0 && (
            <span style={{ position: "absolute", top: -6, right: -6, background: "var(--danger)", color: "white", width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, border: "2px solid var(--surface)" }}>
              {totalCartItems}
            </span>
          )}
        </Link>
      </header>

      <main className="animate-fade-in" style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 24px 100px" }}>
        <div style={{ marginBottom: 48, textAlign: "center", maxWidth: 600, margin: "0 auto 60px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "#E0F2E9", padding: "6px 14px", borderRadius: 20, color: "var(--brand)", fontSize: 13, fontWeight: 700 }}>
            <Store size={14} />
            <span style={{ textTransform: "uppercase", letterSpacing: ".08em" }}>ScanMart Marketplace</span>
          </div>
          <h1 style={{ fontSize: 48, letterSpacing: "-.04em", margin: "0 0 16px", color: "var(--ink)", fontWeight: 800 }}>Browse partner stores</h1>
          <p style={{ color: "var(--muted)", fontSize: 18 }}>Shop directly from local businesses and pick up your order effortlessly.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {state.stores.map((store, i) => {
            const listings = state.listings.filter((l) => l.businessId === store.id && l.isPublished);
            return (
              <Link key={store.id} href={`/shop/${store.slug}`} className={`card shadow-soft animate-slide-up delay-${(i%3)*100}`} style={{ overflow: "hidden", display: "block", textDecoration: "none", transition: "all .2s cubic-bezier(0.16, 1, 0.3, 1)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(4, 26, 21, 0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-soft)"; }}
              >
                <div style={{ height: 160, background: getStoreGradient(store.businessType), display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 28px" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{store.businessType}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em", color: "white" }}>{store.name}</div>
                </div>
                <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>
                    <ShoppingBag size={14} /> {listings.length} products
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)" }}>Shop now &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
