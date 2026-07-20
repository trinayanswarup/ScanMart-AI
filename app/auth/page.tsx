"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, User } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // HARDCODED CREDENTIALS
    if (email === "admin@scanmart.eu" && password === "admin123") {
      document.cookie = "auth_mode=admin; path=/";
      router.push("/admin");
    } else {
      setError("Invalid admin credentials. Access denied.");
    }
  };

  const handleDemoLogin = () => {
    document.cookie = "auth_mode=demo; path=/";
    router.push("/admin");
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--surface)" }}>
      {/* Left panel - Admin Only Warning */}
      <section style={{ padding: 42, background: "#092922", color: "white", display: "flex", flexDirection: "column" }}>
        <div style={{ margin: "auto", maxWidth: 470 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 100, color: "var(--danger)", fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
            <ShieldCheck size={18} /> RESTRICTED ACCESS
          </div>
          <h1 style={{ fontSize: 48, letterSpacing: "-.055em", lineHeight: 1.08, marginBottom: 24 }}>
            Authorized Personnel Only
          </h1>
          <p style={{ color: "#b9c9bf", lineHeight: 1.7, fontSize: 16 }}>
            This workspace is strictly for ScanMart Group administrators. Public account creation is disabled.
          </p>
          <div style={{ marginTop: 40, padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-soft)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".1em" }}>
              Demo Access Available
            </div>
            <p style={{ color: "#929b95", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Reviewing this project? You can use the Demo Access button to explore the workspace without admin credentials. Data changes in demo mode remain local to your browser.
            </p>
          </div>
        </div>
      </section>

      {/* Right panel - Login */}
      <section style={{ padding: 30, display: "grid", placeItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: "var(--canvas)", border: "1px solid var(--line)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--ink)" }}>
              <User size={24} />
            </div>
            <h2 style={{ fontSize: 24, letterSpacing: "-.04em", margin: "0 0 8px" }}>Admin Login</h2>
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>Enter your master credentials</p>
          </div>

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Admin Email</label>
              <input
                className="input"
                type="email"
                placeholder="admin@scanmart.eu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Master Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", fontSize: 13, fontWeight: 600, borderRadius: 6, marginBottom: 16, border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" style={{ width: "100%", padding: "0 24px", height: 44 }}>
              Authenticate <ArrowRight size={16} />
            </button>
            <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 12 }}>
              Hint: admin@scanmart.eu / admin123
            </div>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0", color: "var(--muted)", fontSize: 11, fontWeight: 600, letterSpacing: ".1em" }}>
            <i style={{ height: 1, flex: 1, background: "var(--line)" }} />
            OR
            <i style={{ height: 1, flex: 1, background: "var(--line)" }} />
          </div>

          <button
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ width: "100%", height: 44, justifyContent: "center" }}
          >
            Enter Demo Workspace
          </button>
        </div>
      </section>

      <style>{`@media(max-width:800px){main{grid-template-columns:1fr!important}section:first-child{display:none!important}section:last-child{padding:24px!important}}`}</style>
    </main>
  );
}
