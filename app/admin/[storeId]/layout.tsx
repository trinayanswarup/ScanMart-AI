"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { ArrowLeftRight, Box, Home, ScanLine, Settings, ShoppingBag, Zap } from "lucide-react";

export default function AdminStoreLayout({ children }: { children: React.ReactNode }) {
  const { storeId } = useParams<{ storeId: string }>();
  const { state } = useApp();
  const pathname = usePathname();
  const store = state.stores.find((s) => s.id === storeId);

  const nav = [
    { href: `/admin/${storeId}/dashboard`, label: "Dashboard", icon: Home },
    { href: `/admin/${storeId}/scan`, label: "Scan product", icon: ScanLine },
    { href: `/admin/${storeId}/inventory`, label: "Inventory", icon: Box },
    { href: `/admin/${storeId}/orders`, label: "Orders", icon: ShoppingBag },
    { href: `/admin/${storeId}/automations`, label: "Automations", icon: Zap },
    { href: `/admin/${storeId}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 240, borderRight: "1px solid #e1e9e9", padding: 20, background: "white", flexShrink: 0 }}>
        <div style={{ marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#A4B4CC", textTransform: "uppercase", letterSpacing: ".08em" }}>{state.company.name}</div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 24, color: "#092922" }}>{store?.name ?? "Store"}</div>
        <nav style={{ display: "grid", gap: 4 }}>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== `/admin/${storeId}/dashboard` && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 6,
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                background: active ? "#F0FAF5" : "transparent",
                color: active ? "#2C645B" : "#65777a",
              }}>
                <Icon size={16} /> {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ borderTop: "1px solid #e4e9e5", marginTop: 24, paddingTop: 16 }}>
          <Link href={`/shop/${store?.slug ?? ""}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#65777a", fontWeight: 600, textDecoration: "none", marginBottom: 10 }}>
            <Box size={14} /> View storefront
          </Link>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#A4B4CC", fontWeight: 600, textDecoration: "none" }}>
            <ArrowLeftRight size={14} /> Switch store
          </Link>
        </div>
      </aside>
      <main style={{ flex: 1, minHeight: "100vh" }}>{children}</main>
    </div>
  );
}
