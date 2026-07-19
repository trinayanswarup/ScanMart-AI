﻿"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, Box, CheckCircle2, ChevronRight, CircleAlert, Clock, Euro, MoreVertical, ScanLine, ShoppingBag, TrendingUp, Users, Activity } from "lucide-react";
import { useApp } from "@/components/app-provider";

export default function AdminDashboardPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { state, getStore, getStoreInventory, getStoreOrders } = useApp();
  const store = getStore(storeId);

  const inv = getStoreInventory(storeId);
  const active = inv.filter((item) => item.status === "active");
  const low = active.filter((item) => item.quantity <= item.lowStockThreshold);
  const orders = getStoreOrders(storeId);
  const pending = orders.filter((item) => item.status === "new").length;
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const storeWorkflowIds = new Set(state.workflows.filter((w) => w.businessId === storeId).map((w) => w.id));
  const latest = state.executions.find((e) => storeWorkflowIds.has(e.workflowId));

  return (
    <div className="animate-fade-in" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* â”€â”€â”€ TOP METRICS (3 Columns) â”€â”€â”€ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        
        <div className="card shadow-soft" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Revenue</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.03em" }}>€{revenue.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)", display: "flex", alignItems: "center", gap: 4 }}>
            <ArrowUpRight size={14} /> 12% increase from last month
          </div>
        </div>

        <div className="card shadow-soft" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9", display: "grid", placeItems: "center" }}>
              <Box size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Total Inventory</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.03em" }}>{active.length}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: low.length ? "#D97706" : "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
            {low.length ? <><CircleAlert size={14} /> {low.length} items low on stock</> : "All stock levels healthy"}
          </div>
        </div>

        <div className="card shadow-soft" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245, 158, 11, 0.1)", color: "var(--amber)", display: "grid", placeItems: "center" }}>
              <ShoppingBag size={24} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>Open Orders</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.03em" }}>{pending}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
            {orders.length} total lifetime orders
          </div>
        </div>

      </div>

      {/* â”€â”€â”€ MIDDLE SECTION â”€â”€â”€ */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 }}>
        
        {/* Recent Activity Widget */}
        <div className="card shadow-soft" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Recent Activity</h2>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Needs your attention</span>
            </div>
            <div className="animate-pulse-ring" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--mint)", marginTop: 6 }} />
          </div>
          
          <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
            {latest ? <>
              {latest.status === "waiting_for_human" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", justifyContent: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF3C7", color: "var(--amber)", display: "grid", placeItems: "center", marginBottom: 8 }}>
                    <ScanLine size={24} />
                  </div>
                  <h3 style={{ fontSize: 18, margin: "0", color: "var(--ink)", fontWeight: 800 }}>New product scanned</h3>
                  <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                    AI has drafted a new storefront listing. It needs your approval before it goes live.
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 24 }}>
                    <Link href={`/admin/${storeId}/automations/${latest.workflowId}`} className="btn btn-primary shadow-glow" style={{ width: "100%", justifyContent: "center" }}>
                      <CheckCircle2 size={16} /> Review & Approve
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center", marginBottom: 8 }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 style={{ fontSize: 16, margin: "0", color: "var(--ink)", fontWeight: 700 }}>You're all caught up!</h3>
                  <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
                    Last activity: {state.workflows.find((wf) => wf.id === latest.workflowId)?.name} completed successfully.
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 24, width: "100%" }}>
                    <Link href={`/admin/${storeId}/automations`} className="btn btn-secondary shadow-soft" style={{ width: "100%", justifyContent: "center" }}>
                      View all activity
                    </Link>
                  </div>
                </div>
              )}
            </> : <div className="empty" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}><Activity size={40} color="var(--brand)" style={{ opacity: 0.2, margin: "0 auto 16px" }} /><p style={{ fontSize: 16, color: "var(--ink)", fontWeight: 600 }}>No recent activity.</p></div>}
          </div>
        </div>

        {/* Trending Products Widget */}
        <div className="card shadow-soft" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Trending Products</h2>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{active.length} total active items</span>
            </div>
            <button className="btn-icon" style={{ background: "transparent", border: "none", color: "var(--muted)" }}><MoreVertical size={16} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {active.slice(0, 4).map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--canvas)", border: "1px solid var(--line)", display: "grid", placeItems: "center" }}>
                  <Box size={20} color="var(--muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                    <span style={{ color: "var(--brand)", fontWeight: 700 }}>{item.quantity}</span> in stock · {item.category}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>€{item.price}</div>
              </div>
            ))}
            {!active.length && <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No active products found.</div>}
            {active.length > 0 && (
              <Link href={`/admin/${storeId}/inventory`} style={{ display: "block", textAlign: "center", padding: 12, fontSize: 13, fontWeight: 700, color: "var(--brand)", textDecoration: "none" }}>
                See all products
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* â”€â”€â”€ BOTTOM SECTION â”€â”€â”€ */}
      <div className="card shadow-soft" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Recent Orders</h2>
          <Link href={`/admin/${storeId}/orders`} className="btn btn-secondary" style={{ height: 32, fontSize: 13, padding: "0 12px" }}>
            View all orders
          </Link>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--canvas)" }}>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Order ID</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Customer / Items</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "16px 24px", fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "16px 24px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>#{order.id.slice(0, 6)}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{order.items.length} items</div>
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {order.status === "new" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(245, 158, 11, 0.1)", color: "#D97706", fontSize: 12, fontWeight: 700 }}>
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(16, 185, 129, 0.1)", color: "#059669", fontSize: 12, fontWeight: 700 }}>
                        <CheckCircle2 size={12} /> Complete
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                    €{order.totalAmount}
                  </td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14, fontWeight: 500 }}>
                    No orders have been placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
