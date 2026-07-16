"use client";

import Link from "next/link";
import { Archive, Box, ExternalLink, Filter, PackagePlus, Search, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";

export default function InventoryPage() {
  const { state, currentStoreId, getStoreInventory, getStoreListings, updateInventory, publishItem } = useApp();
  const storeId = currentStoreId ?? state.stores[0]?.id ?? "";
  const storeInv = getStoreInventory(storeId);
  const storeListings = getStoreListings(storeId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const categories = [...new Set(storeInv.map((item) => item.category))];
  const items = useMemo(() => storeInv.filter((item) =>
    item.status !== "archived" &&
    (item.name.toLowerCase().includes(search.toLowerCase()) || item.brand?.toLowerCase().includes(search.toLowerCase())) &&
    (category === "all" || item.category === category) &&
    (!lowOnly || item.quantity <= item.lowStockThreshold)
  ), [storeInv, search, category, lowOnly]);

  return <div className="page-wrap">
    <div className="page-header"><div><h1>Inventory</h1><p>Manage product data, stock levels, and storefront visibility.</p></div><div style={{ display: "flex", gap: 10 }}><Link className="btn btn-secondary" href="/inventory/new"><PackagePlus size={16} />Add manually</Link><Link className="btn btn-primary" href="/scan"><Sparkles size={16} />Scan with AI</Link></div></div>
    <div className="card">
      <div style={{ padding: 16, borderBottom: "1px solid #e4e9e5", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 270px" }}><Search size={16} style={{ position: "absolute", left: 12, top: 13, color: "#7d8981" }} /><input className="input" style={{ paddingLeft: 37 }} placeholder="Search products or brands..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="select" style={{ width: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select>
        <button className={`btn ${lowOnly ? "btn-primary" : "btn-secondary"}`} onClick={() => setLowOnly(!lowOnly)}><Filter size={15} />Low stock</button>
      </div>
      {items.length ? <div className="table-wrap"><table className="table"><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th><th>Source</th><th>Storefront</th><th>Actions</th></tr></thead><tbody>{items.map((item) => {
        const listing = storeListings.find((entry) => entry.inventoryItemId === item.id);
        const low = item.quantity <= item.lowStockThreshold;
        return <tr key={item.id}><td><Link href={`/products/${item.id}`}><strong>{item.name}</strong><span className="muted" style={{ display: "block", fontSize: 11, marginTop: 4 }}>{item.brand || "Unbranded"}</span></Link></td><td>{item.category}</td><td><strong style={{ color: low ? "#9D552C" : undefined }}>{item.quantity} {item.unit}</strong>{low && <span className="badge badge-amber" style={{ marginLeft: 8 }}>Low</span>}</td><td>{item.price ? `₹${item.price}` : <span className="muted">Not set</span>}</td><td><span className={`badge ${item.source === "ai_scan" ? "badge-green" : "badge-gray"}`}>{item.source.replace("_", " ")}</span></td><td><span className={`badge ${listing?.isPublished ? "badge-green" : "badge-gray"}`}>{listing?.isPublished ? "Published" : "Unpublished"}</span></td><td><div style={{ display: "flex", gap: 5 }}><Link title="Open product" href={`/products/${item.id}`} className="btn btn-ghost" style={{ padding: "0 8px" }}><ExternalLink size={15} /></Link>{!listing?.isPublished && <button title="Publish" className="btn btn-ghost" style={{ padding: "0 8px" }} onClick={() => item.price ? publishItem(item.id) : alert("Set a price before publishing.")}><Send size={15} /></button>}<button title="Archive" className="btn btn-ghost" style={{ padding: "0 8px" }} onClick={() => updateInventory(item.id, { status: "archived" })}><Archive size={15} /></button></div></td></tr>;
      })}</tbody></table></div> : <div className="empty"><div className="empty-icon"><Box /></div><h3>No products found</h3><p className="muted">Try clearing your filters or add your first product.</p><Link href="/scan" className="btn btn-primary">Scan a product</Link></div>}
    </div>
    <p className="muted" style={{ fontSize: 11, textAlign: "right" }}>Showing {items.length} of {storeInv.filter((item) => item.status !== "archived").length} active items</p>
  </div>;
}
