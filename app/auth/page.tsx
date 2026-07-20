"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { signIn, signUp } from "@/lib/auth";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "signin") {
      const result = await signIn(email, password);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.push(next);
      }
    } else {
      const result = await signUp(email, password);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSignUpSuccess(true);
      }
    }

    setLoading(false);
  }

  return (
    <div style={{ width: "100%", maxWidth: 410 }}>
      <h2 style={{ fontSize: 30, letterSpacing: "-.04em", marginBottom: 8 }}>
        {tab === "signin" ? "Welcome back" : "Create an account"}
      </h2>
      <p className="muted" style={{ marginBottom: 28 }}>
        {tab === "signin"
          ? "Sign in to manage your store and inventory."
          : "Set up your ScanMart store owner account."}
      </p>

      {/* Tab toggle */}
      <div style={{ display: "flex", background: "var(--canvas)", borderRadius: 8, padding: 4, marginBottom: 24, border: "1px solid var(--line)" }}>
        {(["signin", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); setSignUpSuccess(false); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: tab === t ? "var(--surface)" : "transparent",
              color: tab === t ? "var(--ink)" : "var(--muted)",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.2s",
            }}
          >
            {t === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {signUpSuccess ? (
        <div style={{ padding: "20px 16px", background: "rgba(124,212,172,0.1)", border: "1px solid var(--mint)", borderRadius: 8, textAlign: "center" }}>
          <CheckCircle2 size={32} color="var(--mint)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Check your inbox</div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <p style={{ color: "var(--danger)", fontSize: 13, margin: "8px 0 0", fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: 20 }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {tab === "signin" ? "Sign in" : "Create account"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "25px 0", color: "var(--muted)", fontSize: 11 }}>
        <i style={{ height: 1, flex: 1, background: "var(--line)" }} />
        OR
        <i style={{ height: 1, flex: 1, background: "var(--line)" }} />
      </div>

      <Link
        href="/admin"
        className="btn btn-secondary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        Try the demo
      </Link>
      <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginTop: 14, textAlign: "center" }}>
        No account needed. Data stays in this browser only.
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--surface)" }}>
      {/* Left panel */}
      <section style={{ padding: 42, background: "#092922", color: "white", display: "flex", flexDirection: "column" }}>
        <Logo />
        <div style={{ margin: "auto", maxWidth: 470 }}>
          <div className="eyebrow" style={{ color: "#7CD4AC" }}>Your business, connected</div>
          <h1 style={{ fontSize: 48, letterSpacing: "-.055em", lineHeight: 1.08 }}>
            One workspace from stockroom to storefront.
          </h1>
          <p style={{ color: "#b9c9bf", lineHeight: 1.7 }}>
            Scan products, keep inventory accurate, and fulfill local orders with an AI-assisted workflow.
          </p>
          <div style={{ marginTop: 34, display: "grid", gap: 14 }}>
            {[
              "No paid AI account required",
              "Ready immediately, no setup needed",
              "Your corrections stay under your control",
            ].map((item) => (
              <span key={item} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                <CheckCircle2 size={17} color="#7CD4AC" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Right panel */}
      <section style={{ padding: 30, display: "grid", placeItems: "center" }}>
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </section>

      <style>{`@media(max-width:800px){main{grid-template-columns:1fr!important}section:first-child{display:none!important}section:last-child{padding:24px!important}}`}</style>
    </main>
  );
}
