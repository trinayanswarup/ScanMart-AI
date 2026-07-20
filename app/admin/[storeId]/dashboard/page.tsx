"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, Box, CheckCircle2, ChevronRight, CircleAlert, Clock, Euro, MoreVertical, PackagePlus, ScanLine, ShoppingBag, TrendingUp, Users, Activity } from "lucide-react";
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
      
      {/* â"€â"€â"€ TOP METRICS (3 Columns) â"€â"€â"€ */}
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
          <div style={{ fontSize: 13, fontWeight: 600, color: low.length ? "var(--accent)" : "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
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

      {/* MIDDLE SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>

        {/* Recent Activity - compact */}
        <div className="card shadow-soft" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Recent Activity</h2>
            <div className="animate-pulse-ring" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--mint)" }} />
          </div>
          <div style={{ padding: "16px 20px" }}>
            {latest ? (
              latest.status === "waiting_for_human" ? (
                <Link href={`/admin/${storeId}/automations/${latest.workflowId}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245, 158, 11, 0.12)", color: "var(--amber)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <ScanLine size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Approval needed</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>New scan draft awaiting review</div>
                  </div>
                  <ChevronRight size={16} color="var(--muted)" />
                </Link>
              ) : (
                <Link href={`/admin/${storeId}/automations`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>All caught up</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{state.workflows.find((wf) => wf.id === latest.workflowId)?.name}</div>
                  </div>
                  <ChevronRight size={16} color="var(--muted)" />
                </Link>
              )
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--canvas)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Activity size={16} color="var(--muted)" />
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>No activity yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Add to Inventory - new action card */}
        <div className="card shadow-soft" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: 0 }}>Add to Inventory</h2>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Stock your shelves fast</span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 4px", lineHeight: 1.5 }}>AI reads your product photo or barcode in seconds.</p>
            <Link href={`/admin/${storeId}/scan`} className="btn btn-primary" style={{ justifyContent: "center", fontSize: 13 }}>
              <ScanLine size={15} /> Scan with AI
            </Link>
            <Link href={`/admin/${storeId}/inventory/new`} className="btn btn-secondary" style={{ justifyContent: "center", fontSize: 13 }}>
              <PackagePlus size={15} /> Add manually
            </Link>
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

      {/* â"€â"€â"€ BOTTOM SECTION â"€â"€â"€ */}
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
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(245, 158, 11, 0.1)", color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(16, 185, 129, 0.1)", color: "var(--brand)", fontSize: 12, fontWeight: 700 }}>
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
