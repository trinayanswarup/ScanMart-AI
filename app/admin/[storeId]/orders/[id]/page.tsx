"use client";

import Link from "next/link";
import { ArrowLeft, Check, PackageCheck, Phone, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";

export default function AdminOrderDetailPage() {
  const { storeId, id } = useParams<{ storeId: string; id: string }>();
  const { state, updateOrderStatus } = useApp();
  const [message, setMessage] = useState("");
  const order = state.orders.find((item) => item.id === id);
  if (!order) return <div className="page-wrap"><div className="empty">Order not found.</div></div>;
  const change = (status: typeof order.status) => { const result = updateOrderStatus(id, status); setMessage(result.ok ? `Order marked ${status}.` : result.message || "Could not update order."); };
  return <div className="page-wrap" style={{ maxWidth: 1000 }}><Link href={`/admin/${storeId}/orders`} className="btn btn-ghost" style={{ paddingLeft: 0 }}><ArrowLeft size={16} />Back to orders</Link><div className="page-header" style={{ marginTop: 12 }}><div><div style={{ display: "flex", gap: 10, alignItems: "center" }}><h1>Order #{id.split("_").slice(-1)[0]?.toUpperCase()}</h1><StatusBadge status={order.status} /></div><p>Received {new Date(order.createdAt).toLocaleString()}</p></div><div style={{ display: "flex", gap: 8 }}>{order.status === "new" && <><button className="btn btn-danger" onClick={() => change("cancelled")}><X size={16} />Cancel</button><button className="btn btn-primary" onClick={() => change("accepted")}><Check size={16} />Accept order</button></>}{order.status === "accepted" && <button className="btn btn-primary" onClick={() => change("completed")}><PackageCheck size={16} />Mark completed</button>}</div></div>{message && <div className={message.startsWith("Could") || message.includes("enough") ? "error-text" : "notice"} style={{ marginBottom: 18 }}>{message}</div>}
    <div className="grid-2" style={{ gridTemplateColumns: "1.25fr .75fr" }}><section className="card" style={{ padding: 24 }}><h2 className="section-title">Order items</h2><div style={{ marginTop: 14 }}>{order.items.map((item) => <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 15, padding: "17px 0", borderBottom: "1px solid var(--line)" }}><div><strong>{item.name}</strong><span className="muted" style={{ display: "block", fontSize: 11, marginTop: 5 }}>{item.quantity} × €{item.unitPrice}</span></div><strong>€{item.lineTotal}</strong></div>)}</div><div style={{ display: "flex", justifyContent: "space-between", paddingTop: 20, fontSize: 17 }}><strong>Total</strong><strong>€{order.totalAmount}</strong></div></section><aside style={{ display: "grid", gap: 18 }}><section className="card" style={{ padding: 22 }}><h2 className="section-title">Customer</h2><strong style={{ display: "block", marginTop: 18 }}>{order.customerName}</strong><div style={{ display: "grid", gap: 9, marginTop: 12, fontSize: 12, color: "var(--muted)" }}>{order.customerPhone && <span style={{ display: "flex", gap: 8 }}><Phone size={14} />{order.customerPhone}</span>}{order.customerEmail && <span>{order.customerEmail}</span>}</div></section><section className="card" style={{ padding: 22 }}><h2 className="section-title">Fulfillment</h2><p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>Pay at pickup / cash on delivery.</p><div className="notice">Stock is reduced once this order is accepted.</div></section></aside></div></div>;
}
