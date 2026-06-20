"use client";

import Link from "next/link";
import { ArrowRight, Bot, Box, Check, ScanLine, ShieldCheck, ShoppingBag, Sparkles, Store, Workflow } from "lucide-react";
import { Logo } from "@/components/logo";
import { useApp } from "@/components/app-provider";

const features = [
  { icon: ScanLine, title: "AI product scanning", text: "Turn a product photo or label into clean, structured inventory data." },
  { icon: Box, title: "Tailored inventory", text: "Start with categories designed for salons, caféss, and grocery stores." },
  { icon: Store, title: "Instant mini-store", text: "Publish inventory to a clean storefront without a separate website." },
  { icon: Workflow, title: "Workflow automation", text: "Connect scans, listings, orders, and stock updates into one flow." },
  { icon: Sparkles, title: "Low-stock intelligence", text: "Catch products that need attention before the shelf runs empty." },
  { icon: ShieldCheck, title: "Human validation", text: "Keep the speed of AI while staying in control of every product." },
];

export default function LandingPage() {
  const { state } = useApp();
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <header className="landing-nav">
        <Logo />
        <nav><a href="#features">Features</a><a href="#how">How it works</a><Link href="/auth">Sign in</Link></nav>
        <Link href="/dashboard" className="btn btn-primary">Try demo <ArrowRight size={16} /></Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-pill"><Sparkles size={14} /> Built for local businesses</div>
            <h1>Turn physical stock into <span>inventory, storefronts, and automated workflows.</span></h1>
            <p>ScanMart AI is an AI-native platform for small businesses that converts product scans into structured inventory, publishable storefront listings, and automated operational workflows.</p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary">Try demo dashboard <ArrowRight size={16} /></Link>
              <Link href={`/store/${state.business.slug}`} className="btn btn-secondary">View demo store</Link>
            </div>
            <div className="trust-row"><span><Check size={15} /> No card required</span><span><Check size={15} /> Works without paid AI</span><span><Check size={15} /> Setup in minutes</span></div>
          </div>
          <div className="hero-visual">
            <div className="visual-window">
              <div className="window-top"><i /><i /><i /><span>scanmart.ai/scan</span></div>
              <div className="scan-demo">
                <div className="scan-preview"><div className="bottle"><span>DOVE</span><b>Intense<br />Repair</b><small>SHAMPOO</small></div><div className="scan-corners" /></div>
                <div className="result-panel"><div className="result-head"><div><small>AI EXTRACTION</small><strong>Product recognized</strong></div><span>94% confident</span></div>
                  <label>Product name</label><div className="fake-input">Dove Intense Repair Shampoo</div>
                  <div className="fake-grid"><div><label>Category</label><div className="fake-input">Haircare</div></div><div><label>Quantity</label><div className="fake-input">1 pcs</div></div></div>
                  <button><Sparkles size={15} /> Confirm & add to inventory</button>
                </div>
              </div>
            </div>
            <div className="float-card float-one"><div><Bot size={18} /></div><span><b>AI extracted 8 fields</b><small>Ready for your review</small></span></div>
            <div className="float-card float-two"><div><ShoppingBag size={18} /></div><span><b>Storefront updated</b><small>Product is now live</small></span></div>
          </div>
        </section>
        <section className="logo-strip"><span>Purpose-built for</span><b>Salon & Barber</b><b>Café</b><b>Grocery & Kirana</b></section>
        <section id="features" className="feature-section">
          <div className="section-intro"><div className="eyebrow">Everything connected</div><h2>From shelf to sale, in one simple flow.</h2><p>Your inventory, storefront, orders, and automations finally speak the same language.</p></div>
          <div className="feature-grid">{features.map(({ icon: Icon, title, text }) => <article key={title}><div className="feature-icon"><Icon size={21} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>
        <section id="how" className="flow-section">
          <div><div className="eyebrow">A smarter workflow</div><h2>One scan starts the whole journey.</h2><p>ScanMart AI removes the repetitive work between receiving a product and selling it online.</p><Link href="/scan" className="btn btn-primary">Scan your first product</Link></div>
          <div className="steps">{["Capture a product", "Review AI details", "Publish to your store", "Automate after every order"].map((step, index) => <div className="step" key={step}><span>{index + 1}</span><div><b>{step}</b><small>{["Use your phone, webcam, or upload an image.", "Correct anything before it reaches inventory.", "Create a listing with a single click.", "Reduce stock and surface low-stock alerts."][index]}</small></div></div>)}</div>
        </section>
      </main>
      <footer><Logo /><span>Turn physical stock into inventory, storefronts, and automated workflows.</span><span>© 2026 ScanMart AI</span></footer>
      <style jsx>{`
        .landing-nav { max-width: 1240px; height: 78px; margin: auto; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
        .landing-nav nav { display: flex; gap: 30px; color: #5e6962; font-size: 14px; font-weight: 650; }
        .hero { max-width: 1240px; margin: auto; padding: 75px 24px 95px; display: grid; grid-template-columns: .88fr 1.12fr; gap: 65px; align-items: center; }
        .hero-pill { display: inline-flex; align-items: center; gap: 7px; background: #F6F6F6; color: #2C645B; font-size: 12px; font-weight: 800; padding: 8px 11px; border-radius: 4px; }
        .hero h1 { font-size: clamp(47px, 5vw, 70px); line-height: 1.02; letter-spacing: -.065em; margin: 24px 0; } .hero h1 span { color: #2C645B; }
        .hero-copy > p { color: #657169; font-size: 18px; line-height: 1.7; max-width: 600px; }
        .hero-actions { display: flex; gap: 12px; margin-top: 30px; } .hero-actions :global(.btn) { min-height: 50px; padding: 0 20px; }
        .trust-row { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 24px; color: #768179; font-size: 12px; } .trust-row span { display: flex; gap: 6px; align-items: center; }
        .hero-visual { position: relative; } .visual-window { border: 1px solid #dce4de; border-radius: 6px; overflow: hidden; box-shadow: 0 35px 70px rgb(24 61 39 / 15%); transform: rotate(1deg); }
        .window-top { height: 40px; display: flex; align-items: center; gap: 6px; background: #f8faf8; padding: 0 13px; border-bottom: 1px solid #e7ebe8; } .window-top i { width: 8px; height: 8px; border-radius: 50%; background: #d6ddd8; }.window-top span { margin-left: 10px; font-size: 9px; color: #9aa39d; }
        .scan-demo { background: #fff; padding: 22px; display: grid; grid-template-columns: .9fr 1.1fr; gap: 18px; }
        .scan-preview { position: relative; min-height: 350px; background: #eff2ef; border-radius: 6px; display: grid; place-items: center; overflow: hidden; }
        .bottle { width: 115px; height: 240px; border-radius: 6px 6px 6px 6px; background: linear-gradient(145deg,#fdfefe,#dae9df); box-shadow: 0 18px 30px #bcc9c0; display: flex; flex-direction: column; align-items: center; padding-top: 48px; color: #1e5171; transform: rotate(-4deg); } .bottle span { font-size: 16px; font-weight: 900; }.bottle b { font-size: 23px; line-height: .9; text-align: center; margin: 26px 0 12px; color: #18455f; }.bottle small { font-size: 8px; font-weight: 800; letter-spacing: .15em; }
        .scan-corners { position: absolute; inset: 30px; border: 2px solid #73AB95; border-radius: 5px; opacity: .65; }
        .result-panel { padding: 7px; } .result-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 26px; }.result-head small,.result-head strong { display:block }.result-head small { font-size: 8px; color:#7e8982; letter-spacing:.1em; font-weight:800 }.result-head strong{margin-top:5px;font-size:14px}.result-head > span { font-size:8px;background:#F6F6F6;color:#2C645B;padding:5px 7px;border-radius: 4px;font-weight:800}
        .result-panel label { display:block;font-size:8px;font-weight:800;color:#6f7b73;margin:12px 0 5px}.fake-input{border:1px solid #e1e6e2;border-radius: 5px;padding:9px;font-size:9px}.fake-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.result-panel button{margin-top:22px;width:100%;border:0;border-radius: 5px;background:#2C645B;color:white;padding:11px;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:6px}
        .float-card { position:absolute;display:flex;gap:10px;align-items:center;background:white;border:1px solid #e1e7e2;border-radius: 5px;padding:11px 14px;box-shadow:0 12px 30px rgb(30 55 39 / 12%)}.float-card>div{width:32px;height:32px;border-radius: 5px;background:#F6F6F6;color:#2C645B;display:grid;place-items:center}.float-card b,.float-card small{display:block}.float-card b{font-size:10px}.float-card small{font-size:8px;color:#7b857e;margin-top:3px}.float-one{left:-28px;top:50px}.float-two{right:-15px;bottom:42px}
        .logo-strip { border-top:1px solid #edf0ed;border-bottom:1px solid #edf0ed;min-height:94px;display:flex;align-items:center;justify-content:center;gap:70px;color:#909a93;font-size:12px}.logo-strip b{font-size:15px;color:#56615a}
        .feature-section { max-width:1160px;margin:auto;padding:110px 24px}.section-intro{text-align:center;max-width:680px;margin:0 auto 48px}.section-intro h2,.flow-section h2{font-size:40px;letter-spacing:-.05em;margin:14px 0;color:#092922}.section-intro p,.flow-section>div>p{color:#4f625e;line-height:1.7;font-weight:500}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.feature-grid article{position:relative;overflow:hidden;background:#fff;border:1px solid #A4B4CC;border-radius: 6px;padding:27px;box-shadow:0 10px 30px rgb(9 41 34 / 7%);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.feature-grid article::before{content:"";position:absolute;inset:0 0 auto;height:4px;background:#73AB95}.feature-grid article:nth-child(3n+2)::before{background:#EB774D}.feature-grid article:nth-child(3n)::before{background:#7CD4AC}.feature-grid article:hover{transform:translateY(-4px);border-color:#73AB95;box-shadow:0 18px 42px rgb(9 41 34 / 13%)}.feature-grid h3{font-size:16px;font-weight:750;color:#092922;margin:19px 0 9px}.feature-grid p{font-size:13px;font-weight:500;color:#4f625e;line-height:1.65}.feature-icon{width:46px;height:46px;display:grid;place-items:center;border-radius: 5px;background:#2C645B;color:#fff;box-shadow:0 7px 16px rgb(44 100 91 / 20%)}
        .flow-section{max-width:1160px;margin:0 auto 100px;background:#092922;color:white;border-radius: 6px;padding:60px;display:grid;grid-template-columns:1fr 1fr;gap:90px}.flow-section .eyebrow{color:#7CD4AC}.flow-section>div>p{color:#b5c9bc;margin-bottom:28px}.flow-section .btn-primary{background:white;color:#2C645B}.steps{display:flex;flex-direction:column;gap:12px}.step{display:flex;gap:16px;align-items:center;background:rgb(255 255 255 / 7%);border:1px solid rgb(255 255 255 / 10%);padding:14px;border-radius: 5px}.step>span{width:32px;height:32px;display:grid;place-items:center;border-radius: 5px;background:#2C645B;color:#7CD4AC;font-weight:800;font-size:12px}.step b,.step small{display:block}.step b{font-size:13px}.step small{font-size:10px;color:#aebfb4;margin-top:4px}
        footer{border-top:1px solid #e8ece9;max-width:1240px;margin:auto;padding:30px 24px;display:flex;justify-content:space-between;align-items:center;color:#7b857e;font-size:11px}
        @media(max-width:900px){.hero{grid-template-columns:1fr;padding-top:40px}.hero-copy{text-align:center}.hero-copy>p{margin-left:auto;margin-right:auto}.hero-actions,.trust-row{justify-content:center}.feature-grid{grid-template-columns:repeat(2,1fr)}.flow-section{margin-left:16px;margin-right:16px;grid-template-columns:1fr;gap:35px;padding:35px}.landing-nav nav{display:none}.logo-strip{gap:25px;flex-wrap:wrap;padding:22px}.float-one{left:0}.float-two{right:0}}@media(max-width:600px){.hero h1{font-size:44px}.scan-demo{grid-template-columns:1fr}.result-panel{display:none}.scan-preview{min-height:300px}.feature-grid{grid-template-columns:1fr}.feature-section{padding:75px 16px}.landing-nav>.btn{display:none}.hero{padding-left:16px;padding-right:16px}.hero-actions{flex-direction:column}.trust-row{display:none}.float-card{display:none}.section-intro h2,.flow-section h2{font-size:32px}footer{flex-direction:column;gap:18px;text-align:center}}
      `}</style>
    </div>
  );
}


