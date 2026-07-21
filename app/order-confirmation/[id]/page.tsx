"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useApp } from "@/components/app-provider";

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const order = state.orders.find((item) => item.id === id);
  const orderStore = order ? state.stores.find((s) => s.id === order.businessId) : undefined;
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f7f9f7" }}>
    <div className="card" style={{ maxWidth: 520, padding: 40, textAlign: "center" }}>
      <div className="empty-icon" style={{ width: 64, height: 64 }}><CheckCircle2 size={31} /></div>
      <div className="eyebrow">Order request sent</div>
      <h1 style={{ fontSize: 32, letterSpacing: "-.04em" }}>Thanks, {order?.customerName || "your order is in"}!</h1>
      <p className="muted" style={{ lineHeight: 1.7 }}>The seller will confirm your order. Payment is handled at pickup or by cash on delivery.</p>
      <div className="subtle-card" style={{ padding: 16, margin: "22px 0", display: "flex", justifyContent: "space-between" }}>
        <span>Order reference</span>
        <strong>#{(id.split("_").slice(-1)[0] ?? id).toUpperCase().slice(0, 8)}</strong>
      </div>
      <Link href={orderStore ? `/shop/${orderStore.slug}` : "/shop"} className="btn btn-primary">Back to storefront</Link>
    </div>
  </main>;
}
