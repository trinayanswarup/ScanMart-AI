import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Package, ScanLine, ShieldCheck, ShoppingBag, Sparkles, Store, Zap } from "lucide-react";

const businesses = [
  { type: "Salon", icon: "✂️", name: "Urban Glow Salon", items: "4 products", orders: "0 orders" },
  { type: "Café", icon: "☕", name: "Corner Café", items: "4 products", orders: "1 order" },
  { type: "Grocery", icon: "🛒", name: "FreshMart", items: "4 products", orders: "1 order" },
];

const steps = [
  { icon: ScanLine, step: "01", title: "Scan any product", body: "Upload a photo, scan a barcode, or describe the label. Tesseract OCR + NVIDIA AI Vision extract everything in seconds." },
  { icon: CheckCircle2, step: "02", title: "Review & approve", body: "AI shows a confidence score. You see exactly what it extracted and why. Edit anything before saving." },
  { icon: Store, step: "03", title: "Storefront goes live", body: "One approval click publishes your product to a public storefront. Customers can browse, add to cart, and order." },
  { icon: Zap, step: "04", title: "Workflows handle the rest", body: "Every action — scan, order, low stock — triggers a logged automation. Full audit trail, always human-controlled." },
];

const features = [
  { icon: Sparkles, title: "Multimodal AI extraction", body: "NVIDIA AI Vision reads the actual image + OCR text together. Confidence scoring tells you exactly how sure it is." },
  { icon: Package, title: "Barcode lookup", body: "Scan any barcode — Open Food Facts fills in product name, brand, and category instantly. No typing." },
  { icon: BarChart3, title: "Real-time inventory", body: "Stock reduces atomically on order acceptance. Low stock alerts trigger before you run out." },
  { icon: ShoppingBag, title: "Built-in storefront", body: "Every business gets a public product page. Search, filter, cart drawer, checkout — no separate e-commerce needed." },
  { icon: Zap, title: "Workflow automation", body: "PRODUCT_SCANNED → ORDER_ACCEPTED → LOW_STOCK workflows run automatically with full node-level execution logs." },
  { icon: CheckCircle2, title: "Human-in-the-loop", body: "Nothing publishes without seller approval. AI assists, you decide. Correction logs track every change." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid #e1e9e9", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 6, background: "#2C645B", display: "grid", placeItems: "center" }}>
            <ScanLine size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.02em" }}>ScanMart AI</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/shop" className="btn btn-secondary" style={{ minHeight: 36, fontSize: 13 }}>Browse stores</Link>
          <Link href="/admin" className="btn btn-primary" style={{ minHeight: 36, fontSize: 13 }}>Admin panel</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: "80px 32px 60px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F0FAF5", border: "1px solid #73AB9540", borderRadius: 20, padding: "6px 14px", marginBottom: 28, fontSize: 13, fontWeight: 700, color: "#2C645B" }}>
          <ShieldCheck size={13} />
          Powered by NVIDIA AI Vision · Tesseract OCR · Open Food Facts
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 900, letterSpacing: "-.05em", lineHeight: 1.05, margin: "0 0 20px", color: "#092922" }}>
          Scan a label.<br />
          <span style={{ color: "#2C645B" }}>Your inventory updates itself.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#65777a", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.6 }}>
          ScanMart AI turns any product photo or barcode into a live inventory record and public storefront — in under 10 seconds.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/admin" className="btn btn-primary" style={{ minHeight: 50, fontSize: 15, padding: "0 28px" }}>
            <ScanLine size={17} /> Start scanning free <ArrowRight size={15} />
          </Link>
          <Link href="/shop" className="btn btn-secondary" style={{ minHeight: 50, fontSize: 15, padding: "0 28px" }}>
            <Store size={17} /> See live storefronts
          </Link>
        </div>
      </section>

      {/* Business previews */}
      <section style={{ padding: "0 32px 60px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {businesses.map((b) => (
            <div key={b.type} style={{ border: "1px solid #e1e9e9", borderRadius: 10, padding: 20, background: "white" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{b.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "#2C645B", textTransform: "uppercase", marginBottom: 4 }}>{b.type}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: "#65777a" }}>{b.items}</span>
                <span style={{ fontSize: 12, color: "#65777a" }}>{b.orders}</span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#A4B4CC" }}>
          Built for salons, cafés, grocery stores — any small business with a product shelf.
        </p>
      </section>

      {/* How it works */}
      <section style={{ padding: "60px 32px", background: "#F6F6F6", borderTop: "1px solid #e1e9e9" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>How it works</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.04em", margin: 0 }}>From shelf to storefront in 4 steps</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {steps.map(({ icon: Icon, step, title, body }) => (
              <div key={step} style={{ background: "white", border: "1px solid #e1e9e9", borderRadius: 10, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: "#F0FAF5", display: "grid", placeItems: "center", color: "#2C645B" }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#A4B4CC", letterSpacing: ".1em" }}>{step}</span>
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>{title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "#65777a", lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Features</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.04em", margin: 0 }}>AI is part of the workflow, not a chatbox</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} style={{ border: "1px solid #e1e9e9", borderRadius: 10, padding: 22, background: "white" }}>
              <div style={{ width: 38, height: 38, borderRadius: 6, background: "#F0FAF5", display: "grid", placeItems: "center", color: "#2C645B", marginBottom: 14 }}>
                <Icon size={17} />
              </div>
              <h3 style={{ margin: "0 0 7px", fontSize: 14, fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#65777a", lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 32px", background: "#092922", textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 36, fontWeight: 800, letterSpacing: "-.04em", margin: "0 0 14px" }}>
          Ready to scan your first product?
        </h2>
        <p style={{ color: "#73AB95", fontSize: 16, margin: "0 0 32px" }}>
          No sign-up needed. Full demo with real AI extraction.
        </p>
        <Link href="/admin" className="btn" style={{ background: "#EB774D", color: "white", minHeight: 52, fontSize: 16, padding: "0 36px", borderColor: "#EB774D" }}>
          <ScanLine size={18} /> Try ScanMart AI free <ArrowRight size={15} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px 32px", borderTop: "1px solid #e1e9e9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#A4B4CC" }}>
        <span style={{ fontWeight: 700, color: "#2C645B" }}>ScanMart AI</span>
        <span>Built for small businesses · Powered by NVIDIA AI Vision</span>
      </footer>
    </div>
  );
}
