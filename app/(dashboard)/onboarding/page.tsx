"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Coffee, Scissors, ShoppingBasket } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { templates } from "@/lib/seed";
import type { BusinessType } from "@/types";

const choices = [
  { type: "salon" as const, icon: Scissors, title: "Salon / Barber", text: "Products, tools, styling, and care supplies." },
  { type: "cafe" as const, icon: Coffee, title: "Café", text: "Ingredients, packaging, and counter inventory." },
  { type: "grocery" as const, icon: ShoppingBasket, title: "Grocery / Kirana", text: "Everyday goods across fast-moving categories." },
];

export default function OnboardingPage() {
  const { state, updateBusiness } = useApp();
  const router = useRouter();
  const [type, setType] = useState<BusinessType>(state.business.businessType);
  const [name, setName] = useState(state.business.name);
  const [slug, setSlug] = useState(state.business.slug);
  return <div className="page-wrap" style={{ maxWidth: 950 }}>
    <div className="page-header"><div><div className="eyebrow">Workspace setup</div><h1>Tell us about your business.</h1><p>We’ll tailor your starting inventory categories around it.</p></div></div>
    <div className="card" style={{ padding: 28 }}><h2 className="section-title">1. Choose a business type</h2><div className="grid-3" style={{ marginTop: 18 }}>{choices.map(({ type: value, icon: Icon, title, text }) => <button key={value} onClick={() => setType(value)} className="subtle-card" style={{ textAlign: "left", padding: 20, borderColor: type === value ? "#2C645B" : undefined, boxShadow: type === value ? "0 0 0 2px #A4B4CC" : undefined }}><div style={{ display: "flex", justifyContent: "space-between" }}><Icon size={23} color="#2C645B" />{type === value && <Check size={18} color="#2C645B" />}</div><strong style={{ display: "block", marginTop: 18 }}>{title}</strong><p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{text}</p></button>)}</div>
      <h2 className="section-title" style={{ marginTop: 32 }}>2. Business details</h2><div className="form-grid" style={{ marginTop: 18 }}><div><label className="label">Business name</label><input className="input" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} /></div><div><label className="label">Storefront slug</label><div style={{ display: "flex", alignItems: "center" }}><span style={{ padding: "11px 0 11px 12px", border: "1px solid #d9e0db", borderRight: 0, borderRadius: "11px 0 0 11px", color: "#829087", fontSize: 12 }}>store/</span><input className="input" style={{ borderRadius: "0 11px 11px 0" }} value={slug} onChange={(e) => setSlug(e.target.value)} /></div></div></div>
      <div className="notice" style={{ marginTop: 22 }}><strong>Your starter categories:</strong> {templates[type].join(" · ")}</div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 25 }}><button className="btn btn-primary" onClick={() => { updateBusiness({ name, slug, businessType: type }); router.push("/dashboard"); }}>Save workspace</button></div>
    </div>
  </div>;
}

