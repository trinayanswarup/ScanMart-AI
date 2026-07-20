"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { useTheme } from "@/components/theme-provider";
import { ArrowLeftRight, Box, Home, ScanLine, Settings, ShoppingBag, Activity, Search, Bell, Moon, Sun, User, Clock, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function AdminStoreLayout({ children }: { children: React.ReactNode }) {
  const { storeId } = useParams<{ storeId: string }>();
  const { state, getStoreOrders } = useApp();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const store = state.stores.find((s) => s.id === storeId);

  const nav = [
    { href: `/admin/${storeId}/dashboard`, label: "Dashboard", icon: Home },
    { href: `/admin/${storeId}/scan`, label: "Scan product", icon: ScanLine },
    { href: `/admin/${storeId}/inventory`, label: "Inventory", icon: Box },
    { href: `/admin/${storeId}/orders`, label: "Orders", icon: ShoppingBag },
    { href: `/admin/${storeId}/automations`, label: "Activity", icon: Activity },
    { href: `/admin/${storeId}/settings`, label: "Settings", icon: Settings },
  ];

  // Notification calculations
  const pendingOrders = getStoreOrders(storeId).filter(o => o.status === "new");
  const storeWorkflowIds = new Set(state.workflows.filter((w) => w.businessId === storeId).map((w) => w.id));
  const pendingApprovals = state.executions.filter(e => storeWorkflowIds.has(e.workflowId) && e.status === "waiting_for_human");
  
  const notifCount = pendingOrders.length + pendingApprovals.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--canvas)" }}>
      {/* ─── SIDEBAR (Light Theme) ─── */}
      <aside style={{ width: 250, background: "var(--surface)", borderRight: "1px solid var(--line)", padding: "24px 0", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        
        {/* Brand Area */}
        <div style={{ padding: "0 24px", marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
            ScanMart Group
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "var(--ink)" }}>
            {store?.name ?? "Store"}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: "grid", gap: 4 }}>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== `/admin/${storeId}/dashboard` && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 24px",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                background: active ? "var(--brand-soft)" : "transparent",
                color: active ? "var(--brand)" : "var(--muted)",
                borderLeft: active ? "4px solid var(--brand)" : "4px solid transparent",
                transition: "all 0.2s"
              }} className="hover:text-[var(--ink)] hover:bg-[var(--canvas)]">
                <Icon size={18} color={active ? "var(--brand)" : "currentColor"} /> {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Footer Actions */}
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 24, paddingTop: 24, paddingLeft: 24, paddingRight: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <Link href={`/shop/${store?.slug ?? ""}`} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--muted)", fontWeight: 600, textDecoration: "none" }} className="hover:text-[var(--ink)]">
            <Box size={16} /> View storefront
          </Link>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--muted)", fontWeight: 600, textDecoration: "none" }} className="hover:text-[var(--ink)]">
            <ArrowLeftRight size={16} /> Switch store
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        
        {/* Top Header */}
        <header style={{ height: 70, background: "var(--surface)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", flexShrink: 0 }}>
          
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
            Welcome, {store?.name.split(" ")[0]}
          </div>

          {/* Search Bar */}
          <div style={{ display: "flex", alignItems: "center", background: "var(--canvas)", borderRadius: 8, padding: "8px 16px", width: 400, border: "1px solid var(--line)" }}>
            <Search size={16} color="var(--muted)" style={{ marginRight: 8 }} />
            <input type="text" placeholder="Search operations..." style={{ border: "none", background: "transparent", color: "var(--ink)", outline: "none", fontSize: 14, width: "100%" }} />
          </div>

          {/* Right Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button className="btn-icon" onClick={toggleTheme} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div style={{ position: "relative" }} ref={notifRef}>
              <button 
                className="btn-icon" 
                onClick={() => setShowNotifs(!showNotifs)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: showNotifs ? "var(--ink)" : "var(--muted)", position: "relative" }}
              >
                <Bell size={20} />
                {notifCount > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, background: "var(--danger)", color: "white", fontSize: 9, fontWeight: 800, display: "grid", placeItems: "center", borderRadius: "50%" }}>
                    {notifCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifs && (
                <div style={{ position: "absolute", top: "100%", right: 0, width: 320, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", fontWeight: 700, fontSize: 14, color: "var(--ink)", background: "var(--canvas)" }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifCount === 0 ? (
                      <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        You're all caught up!
                      </div>
                    ) : (
                      <>
                        {pendingApprovals.map((exec) => (
                          <Link key={exec.id} href={`/admin/${storeId}/automations/${exec.workflowId}`} onClick={() => setShowNotifs(false)} style={{ display: "flex", gap: 12, padding: 16, borderBottom: "1px solid var(--line)", textDecoration: "none", transition: "background 0.2s" }} className="hover:bg-[var(--canvas)]">
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245, 158, 11, 0.1)", color: "var(--amber)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <ScanLine size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>Approval Required</div>
                              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>A new product draft requires your review.</div>
                            </div>
                          </Link>
                        ))}
                        {pendingOrders.map((order) => (
                          <Link key={order.id} href={`/admin/${storeId}/orders/${order.id}`} onClick={() => setShowNotifs(false)} style={{ display: "flex", gap: 12, padding: 16, borderBottom: "1px solid var(--line)", textDecoration: "none", transition: "background 0.2s" }} className="hover:bg-[var(--canvas)]">
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.1)", color: "#10B981", display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <ShoppingBag size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>New Order #{order.id.slice(0, 6)}</div>
                              <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{order.items.length} items waiting to be fulfilled.</div>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderLeft: "1px solid var(--line)", paddingLeft: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
                <User size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Store Admin</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Business owner</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
