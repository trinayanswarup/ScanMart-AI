"use client";

import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";

export default function AdminOrdersPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { getStore, getStoreOrders } = useApp();
  const store = getStore(storeId);
  const [filter, setFilter] = useState("all");
  const storeOrders = getStoreOrders(storeId);
  const orders = storeOrders.filter((order) => filter === "all" || order.status === filter);
  return <div className="page-wrap"><div className="page-header"><div><h1>Orders</h1><p>Review requests, accept available stock, and complete fulfillment.</p></div></div><div className="card"><div style={{ padding: 16, borderBottom: "1px solid #e4e9e5", display: "flex", gap: 8 }}>{["all", "new", "accepted", "completed", "cancelled"].map((item) => <button className={`btn ${filter === item ? "btn-primary" : "btn-secondary"}`} style={{ textTransform: "capitalize" }} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>{orders.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Received</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>#{order.id.split("_").slice(-1)[0]?.toUpperCase()}</strong></td><td>{order.customerName}<span className="muted" style={{ display: "block", fontSize: 10, marginTop: 4 }}>{order.customerPhone || order.customerEmail}</span></td><td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td><strong>₹{order.totalAmount}</strong></td><td><StatusBadge status={order.status} /></td><td className="muted">{new Date(order.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</td><td><Link href={`/admin/${storeId}/orders/${order.id}`} className="btn btn-ghost"><ChevronRight size={17} /></Link></td></tr>)}</tbody></table></div> : <div className="empty"><div className="empty-icon"><ClipboardList /></div><h3>No {filter === "all" ? "" : filter} orders yet</h3><p className="muted">New customer requests will appear here.</p><Link href={`/shop/${store?.slug ?? ""}`} className="btn btn-secondary">Open storefront</Link></div>}</div></div>;
}
