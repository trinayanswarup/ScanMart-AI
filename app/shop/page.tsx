"use client";

import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { Logo } from "@/components/logo";

const storeIcons: Record<string, string> = { salon: "✂️", cafe: "☕", grocery: "🛒" };

export default function ShopIndexPage() {
  const { state } = useApp();

  return (
    <div style={{ minHeight: "100vh", background: "#fafbf9" }}>
      <header style={{ height: 72, maxWidth: 1200, margin: "auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo />
        <Link href="/cart" style={{ display: "flex", alignItems: "center", gap: 8, background: "#092922", color: "white", border: 0, borderRadius: 5, padding: "10px 14px", fontWeight: 750, fontSize: 13, textDecoration: "none" }}>
          <ShoppingBag size={16} />
          Cart {state.cart.length > 0 && <b style={{ background: "#73AB95", width: 18, height: 18, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 9 }}>{state.cart.reduce((s, i) => s + i.quantity, 0)}</b>}
        </Link>
      </header>

      <main style={{ maxWidth: 1160, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Store size={16} color="#2C645B" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2C645B", textTransform: "uppercase", letterSpacing: ".08em" }}>ScanMart Marketplace</span>
          </div>
          <h1 style={{ fontSize: 42, letterSpacing: "-.05em", margin: "0 0 10px" }}>Browse our stores</h1>
          <p style={{ color: "#65777a", fontSize: 15 }}>Pick up your order locally from any of our partner stores.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {state.stores.map((store) => {
            const listings = state.listings.filter((l) => l.businessId === store.id && l.isPublished);
            return (
              <Link key={store.id} href={`/shop/${store.slug}`} style={{ background: "white", border: "1px solid #e4e9e5", borderRadius: 8, overflow: "hidden", display: "block", textDecoration: "none", transition: ".2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 35px rgb(29 54 38 / 8%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
              >
                <div style={{ height: 130, background: "#092922", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px" }}>
                  <div style={{ color: "white" }}>
                    <div style={{ fontSize: 12, color: "#7CD4AC", fontWeight: 700, textTransform: "capitalize", marginBottom: 6 }}>{store.businessType}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.035em" }}>{store.name}</div>
                  </div>
                  <div style={{ fontSize: 44 }}>{storeIcons[store.businessType] ?? "🏪"}</div>
                </div>
                <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#65777a" }}>{listings.length} products available</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2C645B" }}>Shop now →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
