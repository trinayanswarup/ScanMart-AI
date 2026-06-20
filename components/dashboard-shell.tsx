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
  const { state } = useApp();
  const [open, setOpen] = useState(false);

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
          <Link href={`/store/${state.business.slug}`} onClick={() => setOpen(false)} className="nav-link"><Store size={18} />View storefront</Link>
        </nav>
        <div style={{ marginTop: "auto", padding: 16 }}>
          <div className="business-chip">
            <div className="business-avatar">{state.business.name.slice(0, 1)}</div>
            <div style={{ minWidth: 0 }}><strong>{state.business.name}</strong><span>{state.business.businessType} workspace</span></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>
      {open && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <main className="dashboard-main">
        <header className="mobile-header"><Logo /><button className="btn btn-secondary" onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button></header>
        {children}
      </main>
      <style jsx global>{`
        .sidebar { position: fixed; z-index: 30; inset: 0 auto 0 0; width: 250px; background: #fff; border-right: 1px solid #e4e9e5; display: flex; flex-direction: column; }
        .dashboard-main { margin-left: 250px; min-height: 100vh; }
        .nav-label { color: #9aa39d; padding: 0 10px 8px; font-size: 10px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
        .nav-link { display: flex; align-items: center; gap: 11px; min-height: 43px; padding: 0 12px; border-radius: 5px; color: #5d6861; font-size: 14px; font-weight: 680; margin-bottom: 4px; }
        .nav-link:hover { background: #f4f7f5; color: #243128; }
        .nav-active { background: #F6F6F6 !important; color: #2C645B !important; }
        .business-chip { display: grid; grid-template-columns: 35px 1fr auto; gap: 10px; align-items: center; border: 1px solid #e4e9e5; border-radius: 5px; padding: 10px; }
        .business-avatar { width: 35px; height: 35px; border-radius: 5px; display: grid; place-items: center; color: white; background: #2C645B; font-weight: 800; }
        .business-chip strong, .business-chip span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .business-chip strong { font-size: 12px; } .business-chip span { color: #7a857e; font-size: 10px; margin-top: 3px; text-transform: capitalize; }
        .mobile-header { display: none; }
        .sidebar-overlay { display: none; }
        @media (max-width: 800px) {
          .sidebar { transform: translateX(-105%); transition: .22s ease; box-shadow: 20px 0 40px rgb(20 30 24 / 10%); }
          .sidebar-open { transform: translateX(0); }
          .sidebar-overlay { display: block; position: fixed; z-index: 20; inset: 0; border: 0; background: rgb(15 25 19 / 35%); }
          .dashboard-main { margin-left: 0; }
          .mobile-header { height: 66px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: white; border-bottom: 1px solid #e4e9e5; }
        }
      `}</style>
    </div>
  );
}

