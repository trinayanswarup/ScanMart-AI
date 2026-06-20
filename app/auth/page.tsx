"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "white" }}>
      <section style={{ padding: 42, background: "#092922", color: "white", display: "flex", flexDirection: "column" }}>
        <Logo />
        <div style={{ margin: "auto", maxWidth: 470 }}><div className="eyebrow" style={{ color: "#7CD4AC" }}>Your business, connected</div><h1 style={{ fontSize: 48, letterSpacing: "-.055em", lineHeight: 1.08 }}>One workspace from stockroom to storefront.</h1><p style={{ color: "#b9c9bf", lineHeight: 1.7 }}>Scan products, keep inventory accurate, and fulfill local orders with an AI-assisted workflow.</p>
          <div style={{ marginTop: 34, display: "grid", gap: 14 }}>{["No paid AI account required", "Demo data ready immediately", "Your corrections stay under your control"].map((item) => <span key={item} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}><CheckCircle2 size={17} color="#7CD4AC" />{item}</span>)}</div>
        </div>
      </section>
      <section style={{ padding: 30, display: "grid", placeItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 410 }}><h2 style={{ fontSize: 30, letterSpacing: "-.04em", marginBottom: 8 }}>Welcome back</h2><p className="muted" style={{ marginBottom: 28 }}>Sign in to manage your store and inventory.</p>
          <div style={{ marginBottom: 16 }}><label className="label">Email</label><input className="input" placeholder="you@business.com" type="email" /></div>
          <div><label className="label">Password</label><input className="input" placeholder="••••••••" type="password" /></div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} onClick={() => alert("Connect Supabase credentials to enable account sign-in.")}>Sign in <ArrowRight size={16} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "25px 0", color: "#929b95", fontSize: 11 }}><i style={{ height: 1, flex: 1, background: "#e4e9e5" }} />OR<i style={{ height: 1, flex: 1, background: "#e4e9e5" }} /></div>
          <Link href="/dashboard" className="btn btn-secondary" style={{ width: "100%" }}>Enter demo dashboard</Link>
          <p style={{ fontSize: 11, color: "#8b958e", lineHeight: 1.6, marginTop: 18, textAlign: "center" }}>Demo mode stores changes in this browser. No account or API key needed.</p>
        </div>
      </section>
      <style jsx>{`@media(max-width:800px){main{grid-template-columns:1fr!important}section:first-child{display:none!important}section:last-child{padding:24px!important}}`}</style>
    </main>
  );
}

