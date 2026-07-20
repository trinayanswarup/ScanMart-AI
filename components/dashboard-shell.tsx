"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Box, ChevronDown, LayoutDashboard, ListChecks, Menu, PackagePlus, ScanLine, Settings, ShoppingBag, Store, X, Zap } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { useApp } from "@/components/app-provider";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Box },
  { href: "/scan", label: "Scan product", icon: ScanLine },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state, currentStoreId, setCurrentStoreId } = useApp();
  const [open, setOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  const activeStoreId = currentStoreId ?? state.stores[0]?.id ?? "";
  const activeStore = state.stores.find((s) => s.id === activeStoreId) ?? state.stores[0];

  return (
    <div style={{ minHeight: "100vh" }}>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div style={{ padding: "22px 20px 28px" }}><Logo /></div>
        <nav style={{ padding: "0 12px" }}>
          <div className="nav-label">Workspace</div>
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== "/dashboard" && path.startsWith(`${href}/`));
            return <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-link ${active ? "nav-active" : ""}`}><Icon size={18} />{label}</Link>;
          })}
          <div className="nav-label" style={{ marginTop: 24 }}>Quick links</div>
          <Link href="/inventory/new" onClick={() => setOpen(false)} className="nav-link"><PackagePlus size={18} />Add manually</Link>
          <Link href={`/store/${activeStore?.slug ?? ""}`} onClick={() => setOpen(false)} className="nav-link"><Store size={18} />View storefront</Link>
        </nav>
        <div style={{ marginTop: "auto", padding: 16, position: "relative" }}>
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            style={{ width: "100%", border: "none", background: "transparent", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <div className="business-chip">
              <div className="business-avatar">{activeStore?.name.slice(0, 1) ?? "?"}</div>
              <div style={{ minWidth: 0 }}>
                <strong>{activeStore?.name ?? "Select a store"}</strong>
                <span>{activeStore?.businessType ?? ""} workspace</span>
              </div>
              <ChevronDown size={15} style={{ transform: storeOpen ? "rotate(180deg)" : "none", transition: ".15s" }} />
            </div>
          </button>
          {storeOpen && (
            <div className="store-picker">
              {state.stores.map((store) => (
                <button
                  key={store.id}
                  className={`store-option ${store.id === activeStoreId ? "store-option-active" : ""}`}
                  onClick={() => { setCurrentStoreId(store.id); setStoreOpen(false); }}
                >
                  <strong>{store.name}</strong>
                  <span style={{ textTransform: "capitalize" }}>{store.businessType}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
      {open && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <main className="dashboard-main">
        <header className="mobile-header"><Logo /><button className="btn btn-secondary" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button></header>
        {children}
      </main>
      <style jsx global>{`
        .sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 250px; background: var(--surface); border-right: 1px solid var(--line); display: flex; flex-direction: column; }
        .dashboard-main { margin-left: 250px; min-height: 100vh; }
        .nav-label { color: var(--muted); padding: 0 10px 8px; font-size: 10px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
        .nav-link { display: flex; align-items: center; gap: 11px; min-height: 43px; padding: 0 12px; border-radius: 5px; color: var(--muted); font-size: 14px; font-weight: 680; margin-bottom: 4px; transition: background .12s, color .12s; }
        .nav-link:hover { background: var(--brand-soft); color: var(--ink); }
        .nav-active { background: var(--brand-soft) !important; color: var(--brand) !important; }
        .dark .nav-active { background: rgba(124, 212, 172, 0.1) !important; }
        .business-chip { display: grid; grid-template-columns: 35px 1fr auto; gap: 10px; align-items: center; border: 1px solid var(--line); border-radius: 5px; padding: 10px; transition: background .12s; }
        .business-chip:hover { background: var(--canvas); }
        .business-avatar { width: 35px; height: 35px; border-radius: 5px; display: grid; place-items: center; color: white; background: #2C645B; font-weight: 800; }
        .business-chip strong, .business-chip span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .business-chip strong { font-size: 12px; color: var(--ink); }
        .business-chip span { color: var(--muted); font-size: 10px; margin-top: 3px; text-transform: capitalize; }
        .store-picker { position: absolute; bottom: calc(100% + 4px); left: 16px; right: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); overflow: hidden; z-index: 10; }
        .store-option { width: 100%; border: none; background: transparent; padding: 12px 14px; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 3px; border-bottom: 1px solid var(--line); transition: background .1s; }
        .store-option:last-child { border-bottom: none; }
        .store-option:hover { background: var(--canvas); }
        .store-option strong { font-size: 13px; color: var(--ink); }
        .store-option span { font-size: 11px; color: var(--muted); }
        .store-option-active { background: var(--brand-soft) !important; }
        .store-option-active strong { color: var(--brand); }
        .mobile-header { display: none; }
        .sidebar-overlay { display: none; }
        @media (max-width: 800px) {
          .sidebar { transform: translateX(-105%); transition: .22s ease; box-shadow: 20px 0 40px rgba(0,0,0,0.12); }
          .sidebar-open { transform: translateX(0); }
          .sidebar-overlay { display: block; position: fixed; z-index: 20; inset: 0; border: 0; background: rgba(0,0,0,0.4); }
          .dashboard-main { margin-left: 0; }
          .mobile-header { height: 66px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: var(--surface); border-bottom: 1px solid var(--line); }
        }
      `}</style>
    </div>
  );
}
