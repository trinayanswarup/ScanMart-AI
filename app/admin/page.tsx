"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/components/app-provider";

const storeIcons: Record<string, string> = { salon: "✂️", cafe: "☕", grocery: "🛒" };

export default function AdminHome() {
  const { state } = useApp();

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <ShieldCheck size={16} color="#2C645B" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}>Signed in as ScanMart Group Admin</span>
      </div>
      <h1 style={{ fontSize: 30, letterSpacing: "-.04em", margin: "0 0 8px" }}>Choose a store to manage</h1>
      <p className="muted" style={{ marginBottom: 32 }}>Each store has its own inventory, automations, and public storefront.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {state.stores.map((store) => {
          const itemCount = state.inventory.filter((i) => i.businessId === store.id).length;
          const orderCount = state.orders.filter((o) => o.businessId === store.id).length;
          return (
            <Link key={store.id} href={`/admin/${store.id}/dashboard`} className="card" style={{ padding: 22, display: "block" }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{storeIcons[store.businessType]}</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{store.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4, textTransform: "capitalize" }}>{store.businessType}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{itemCount} products</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{orderCount} orders</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
