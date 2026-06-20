"use client";

import Link from "next/link";
import { ArrowRight, Box, CircleAlert, IndianRupee, PackagePlus, ScanLine, ShoppingBag, Store, Zap } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";

export default function DashboardPage() {
  const { state } = useApp();
  const active = state.inventory.filter((item) => item.status === "active");
  const low = active.filter((item) => item.quantity <= item.lowStockThreshold);
  const published = state.listings.filter((item) => item.isPublished).length;
  const pending = state.orders.filter((item) => item.status === "new").length;
  const latest = state.executions[0];

  return <div className="page-wrap">
    <div className="page-header"><div><div className="eyebrow">Thursday, 18 June</div><h1>Good morning, Urban Glow.</h1><p>Here’s what is happening across your business today.</p></div><div style={{ display: "flex", gap: 10 }}><Link href={`/store/${state.business.slug}`} className="btn btn-secondary"><Store size={16} />View store</Link><Link href="/scan" className="btn btn-primary"><ScanLine size={16} />Scan product</Link></div></div>
    <div className="grid-4">
      <div className="card metric"><div style={{ display: "flex", justifyContent: "space-between" }}><span className="metric-label">Inventory items</span><Box size={18} color="#2C645B" /></div><div className="metric-value">{active.length}</div><small className="muted">{published} published online</small></div>
      <div className="card metric"><div style={{ display: "flex", justifyContent: "space-between" }}><span className="metric-label">Low stock</span><CircleAlert size={18} color="#EB774D" /></div><div className="metric-value">{low.length}</div><small style={{ color: low.length ? "#9D552C" : "#657169" }}>{low.length ? "Needs your attention" : "Stock looks healthy"}</small></div>
      <div className="card metric"><div style={{ display: "flex", justifyContent: "space-between" }}><span className="metric-label">Open orders</span><ShoppingBag size={18} color="#A4B4CC" /></div><div className="metric-value">{pending}</div><small className="muted">{state.orders.length} total orders</small></div>
      <div className="card metric"><div style={{ display: "flex", justifyContent: "space-between" }}><span className="metric-label">Order value</span><IndianRupee size={18} color="#2C645B" /></div><div className="metric-value">₹{state.orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}</div><small className="muted">Demo store revenue</small></div>
    </div>
    <div className="grid-2" style={{ marginTop: 20, gridTemplateColumns: "1.3fr .7fr" }}>
      <section className="card">
        <div style={{ padding: "20px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2 className="section-title">Inventory pulse</h2><p className="muted" style={{ fontSize: 12, margin: "5px 0" }}>Items requiring attention</p></div><Link href="/inventory" className="btn btn-ghost">View all <ArrowRight size={15} /></Link></div>
        {low.length ? <div className="table-wrap"><table className="table" style={{ minWidth: 500 }}><thead><tr><th>Product</th><th>Category</th><th>On hand</th><th>Status</th></tr></thead><tbody>{low.slice(0, 4).map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td><span className="badge badge-amber">Low stock</span></td></tr>)}</tbody></table></div> : <div className="empty"><Box size={28} /><p>Everything is comfortably stocked.</p></div>}
      </section>
      <section className="card" style={{ padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2 className="section-title">Latest automation</h2><p className="muted" style={{ fontSize: 12, margin: "5px 0 0" }}>Live workflow activity</p></div><Zap size={18} color="#2C645B" /></div>
        {latest ? <div style={{ marginTop: 24 }}><StatusBadge status={latest.status} /><h3 style={{ fontSize: 15, margin: "13px 0 5px" }}>{state.workflows.find((wf) => wf.id === latest.workflowId)?.name}</h3><p className="muted" style={{ fontSize: 12 }}>{latest.nodes.length} steps recorded</p><div style={{ borderLeft: "1px solid #dce4de", margin: "22px 0 20px 8px", paddingLeft: 18, display: "grid", gap: 16 }}>{latest.nodes.map((node) => <div key={node.id} style={{ fontSize: 12, position: "relative" }}><i style={{ position: "absolute", left: -23, top: 3, width: 9, height: 9, borderRadius: "50%", background: node.status === "success" ? "#73AB95" : "#EB774D", border: "2px solid white", boxShadow: "0 0 0 1px #bdd1c4" }} />{node.nodeName}</div>)}</div><Link href={`/automations/${latest.workflowId}`} className="btn btn-secondary" style={{ width: "100%" }}>Open execution trace</Link></div> : <div className="empty">No runs yet.</div>}
      </section>
    </div>
    <section style={{ marginTop: 20 }}><h2 className="section-title" style={{ marginBottom: 14 }}>Quick actions</h2><div className="grid-3">{[{ href: "/scan", icon: ScanLine, title: "Scan a product", text: "Use an image, webcam, or label text." }, { href: "/inventory/new", icon: PackagePlus, title: "Add manually", text: "Create a precise inventory record." }, { href: "/automations", icon: Zap, title: "Review workflows", text: "See what your automations have done." }].map(({ href, icon: Icon, title, text }) => <Link href={href} className="card" style={{ padding: 19, display: "flex", gap: 14, alignItems: "center" }} key={title}><div style={{ width: 42, height: 42, borderRadius: 5, background: "#F6F6F6", color: "#2C645B", display: "grid", placeItems: "center" }}><Icon size={19} /></div><div><strong style={{ fontSize: 14 }}>{title}</strong><p className="muted" style={{ fontSize: 11, margin: "5px 0 0" }}>{text}</p></div></Link>)}</div></section>
  </div>;
}

