"use client";

import Link from "next/link";
import { ArrowRight, Box, CheckCircle2, Coffee, Eye, ScanLine, Scissors, ShoppingBag, Store, Sparkles, Github } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", overflowX: "hidden" }}>
      {/* ─── Nav ─── */}
      <nav style={{ padding: "0 40px", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 28, height: 28, background: "var(--ink)", display: "grid", placeItems: "center", transform: "rotate(45deg)" }}>
            <div style={{ transform: "rotate(-45deg)" }}>
              <ShoppingBag size={14} color="white" />
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.03em", color: "var(--ink)", textTransform: "uppercase" }}>ScanMart Group</span>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/shop" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", letterSpacing: ".02em", transition: "color 0.2s" }} className="hover:text-[var(--ink)]">
             Browse stores
          </Link>
          <Link href="/admin" style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", letterSpacing: ".02em", transition: "color 0.2s" }} className="hover:text-[var(--ink)]">
            Store operations
          </Link>
        </div>
      </nav>

      {/* ─── Hero & Mockup (Asymmetric Two-Column) ─── */}
      <section style={{ paddingTop: 160, paddingBottom: 120, paddingLeft: "max(40px, calc((100vw - 1200px) / 2))", paddingRight: 0, display: "flex", alignItems: "center", gap: 60, minHeight: "90vh" }}>
        
        {/* Left: Copy */}
        <div style={{ flex: "0 0 500px", zIndex: 10 }}>
          <div style={{ display: "inline-block", marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", color: "var(--brand)", textTransform: "uppercase", borderBottom: "1px solid var(--brand)", paddingBottom: 6 }}>
              Multi-Brand Retail
            </div>
          </div>

          <h1 style={{ fontSize: "clamp(48px, 6vw, 84px)", fontWeight: 800, letterSpacing: "-.06em", lineHeight: 0.95, margin: "0 0 32px", color: "var(--ink)" }}>
            Everyday<br/>essentials.<br/>
            <span style={{ color: "var(--brand)" }}>Extraordinary<br/>experiences.</span>
          </h1>

          <p style={{ fontSize: 17, color: "var(--muted)", margin: "0 0 48px", lineHeight: 1.7, maxWidth: 420, fontWeight: 400 }}>
            From neighborhood groceries and artisan coffee to premium salon services, ScanMart Retail Group operates a diverse portfolio of community-focused retail brands powered by next-generation technology.
          </p>

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/shop" className="btn btn-primary" style={{ minHeight: 56, fontSize: 14, padding: "0 32px", borderRadius: 0, fontWeight: 700, letterSpacing: ".02em" }}>
              Shop now
            </Link>
            <Link href="/admin" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(44, 100, 91, 0.4)", paddingBottom: 4, transition: "border-color 0.2s" }} className="hover:border-[var(--brand)]">
              Store operations login <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Right: Mockup Bleeding Off Edge */}
        <div className="animate-fade-in delay-200" style={{ flex: 1, position: "relative", height: 600 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: -100, bottom: 0, background: "white", border: "1px solid rgba(44, 100, 91, 0.2)", borderRight: "none", boxShadow: "-20px 40px 80px rgba(44, 100, 91, 0.08)", display: "flex", flexDirection: "column" }}>
            
            {/* Header / Chrome */}
            <div style={{ height: 50, borderBottom: "1px solid rgba(44, 100, 91, 0.15)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".2em", color: "var(--brand)" }}>OS.01</div>
              <div style={{ flex: 1, height: 1, background: "rgba(44, 100, 91, 0.15)" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand)" }}>LIVE INVENTORY</div>
            </div>

            <div style={{ flex: 1, display: "flex", padding: 32, gap: 40 }}>
              {/* Sidebar lines */}
              <div style={{ width: 140, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ height: 2, width: 24, background: "var(--brand)" }} />
                <div style={{ height: 1, width: "100%", background: "rgba(44, 100, 91, 0.15)" }} />
                <div style={{ height: 1, width: "80%", background: "rgba(44, 100, 91, 0.15)" }} />
                <div style={{ height: 1, width: "60%", background: "rgba(44, 100, 91, 0.15)" }} />
              </div>

              {/* Main content */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
                
                {/* Typographic Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, borderBottom: "1px solid rgba(44, 100, 91, 0.15)", paddingBottom: 32 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Products</div>
                    <div style={{ fontSize: 36, fontWeight: 300, color: "var(--ink)", letterSpacing: "-.04em", lineHeight: 1 }}>1,204</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Orders Today</div>
                    <div style={{ fontSize: 36, fontWeight: 300, color: "var(--brand)", letterSpacing: "-.04em", lineHeight: 1 }}>86</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Revenue</div>
                    <div style={{ fontSize: 36, fontWeight: 300, color: "var(--ink)", letterSpacing: "-.04em", lineHeight: 1 }}>€42k</div>
                  </div>
                </div>

                {/* Clean list */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {["Lavender Shampoo", "Cold Brew 250ml", "Organic Honey"].map((name, i) => (
                    <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(44, 100, 91, 0.1)", paddingBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", width: 24 }}>0{i+1}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{name}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", color: i === 1 ? "var(--amber)" : "var(--brand)", textTransform: "uppercase" }}>
                        {i === 1 ? "Low Stock" : "In Stock"}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Our Brands ─── */}
      <section style={{ padding: "120px 40px", background: "white", borderTop: "1px solid rgba(44, 100, 91, 0.2)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-.04em", margin: 0, color: "var(--ink)" }}>
              Brands you love, in your neighborhood.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            
            {/* FreshMart (Full Width Horizontal) */}
            <div style={{ gridColumn: "1 / -1", background: "var(--brand-soft)", padding: "48px 40px", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
              <div style={{ width: 80, height: 80, background: "white", borderRadius: 16, display: "grid", placeItems: "center", flexShrink: 0, border: "1px solid rgba(44, 100, 91, 0.1)", boxShadow: "0 10px 30px rgba(4,26,21,0.05)" }}>
                <ShoppingBag size={36} color="var(--brand)" />
              </div>
              <div style={{ flex: "1 1 300px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".15em", color: "var(--brand)", textTransform: "uppercase", marginBottom: 8 }}>Neighborhood Grocery</div>
                <h3 style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.03em", margin: "0 0 12px" }}>FreshMart</h3>
                <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.6, margin: 0, maxWidth: 600 }}>
                  Your daily destination for fresh produce, pantry staples, and household essentials. Always stocked, always local.
                </p>
              </div>
            </div>

            {/* Corner Café (White Card) */}
            <div style={{ background: "white", border: "1px solid rgba(44, 100, 91, 0.2)", padding: 40, display: "flex", flexDirection: "column" }}>
              <div style={{ width: 48, height: 48, background: "rgba(245, 158, 11, 0.1)", borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 24 }}>
                <Coffee size={24} color="var(--amber)" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".15em", color: "var(--amber)", textTransform: "uppercase", marginBottom: 8 }}>Artisan Coffee & Bakery</div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.03em", margin: "0 0 16px" }}>Corner Café</h3>
              <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                Expertly crafted beverages and freshly baked pastries in a warm, welcoming environment for the community.
              </p>
            </div>

            {/* Urban Glow (Dark Card) */}
            <div style={{ background: "var(--ink)", padding: 40, display: "flex", flexDirection: "column" }}>
              <div style={{ width: 48, height: 48, background: "rgba(115, 171, 149, 0.2)", borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 24 }}>
                <Scissors size={24} color="var(--sage)" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".15em", color: "var(--sage)", textTransform: "uppercase", marginBottom: 8 }}>Premium Salon & Spa</div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-.03em", margin: "0 0 16px" }}>Urban Glow</h3>
              <p style={{ fontSize: 15, color: "var(--sage)", lineHeight: 1.6, margin: 0 }}>
                Elevated personal care and professional styling services using high-end, carefully curated beauty products.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── The ScanMart Advantage (Editorial list) ─── */}
      <section style={{ padding: "120px 40px", background: "var(--canvas)", borderTop: "1px solid rgba(44, 100, 91, 0.2)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          
          <div style={{ marginBottom: 100 }}>
             <h2 style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-.05em", margin: "0 0 24px", color: "var(--ink)", lineHeight: 1.1 }}>
              How we deliver quality,<br/>every day.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
            {[
              { num: "01", title: "Smart Intake", body: "Our store partners use intelligent vision systems to instantly digitize new inventory, keeping our shelves perfectly stocked." },
              { num: "02", title: "Quality Control", body: "Every product detail is verified and managed through a unified operations platform, ensuring accurate pricing and descriptions." },
              { num: "03", title: "Unified Commerce", body: "Whether you shop in-store or through our digital storefronts, our real-time inventory means you always get exactly what you need." },
            ].map((step, i) => (
              <div key={step.num} style={{ display: "flex", gap: "10%", alignItems: "flex-start", borderTop: "1px solid rgba(44, 100, 91, 0.2)", paddingTop: 40 }}>
                {/* Large Ghost Number */}
                <div style={{ fontSize: "clamp(80px, 10vw, 140px)", fontWeight: 300, color: "rgba(44, 100, 91, 0.15)", lineHeight: 0.8, letterSpacing: "-.06em", flexShrink: 0 }}>
                  {step.num}
                </div>
                {/* Content */}
                <div style={{ paddingTop: 16, maxWidth: 400 }}>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.03em", margin: "0 0 20px" }}>{step.title}</h3>
                  <p style={{ fontSize: 16, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section style={{ padding: "120px 40px", background: "var(--ink)", borderTop: "1px solid var(--brand-dark)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ color: "white", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-.05em", margin: "0 0 32px", lineHeight: 1.05 }}>
            Ready to shop<br/>with us?
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 18, margin: "0 auto 60px", fontWeight: 400, maxWidth: 400, lineHeight: 1.6 }}>
            Explore our brands and discover what's in store today.
          </p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", alignItems: "center" }}>
            <Link href="/shop" className="btn" style={{ background: "white", color: "var(--ink)", minHeight: 56, fontSize: 14, padding: "0 40px", borderRadius: 0, fontWeight: 700 }}>
              Browse our stores
            </Link>
            <Link href="/admin" style={{ fontSize: 14, fontWeight: 600, color: "white", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: 4, transition: "border-color 0.2s" }} className="hover:border-white">
              Store operations login
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: "40px", background: "var(--ink)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--muted)", fontWeight: 500, flexWrap: "wrap", gap: 12 }}>
        <div style={{ letterSpacing: ".05em", textTransform: "uppercase" }}>
          ScanMart Retail Group
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span>
            Built by <strong style={{ color: "white", fontWeight: 700 }}>Trinayan Swarup</strong>
          </span>
          <a href="https://github.com/trinayanswarup" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", transition: "color 0.2s" }} className="hover:text-white">
            <Github size={14} /> github.com/trinayanswarup
          </a>
        </div>
      </footer>
    </div>
  );
}
