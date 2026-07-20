"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouterProgressBar() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"hidden" | "loading" | "done">("hidden");
  const [width, setWidth] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef(false);
  const prevPath = useRef(pathname);

  // Start bar immediately on any internal link click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      if (
        !href ||
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href === pathname
      ) return;
      navRef.current = true;
      setPhase("loading");
      setWidth(12);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        setWidth((w) => (w < 84 ? w + (84 - w) * 0.08 + 0.4 : w));
      }, 80);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  // Complete bar when pathname actually changes
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    if (!navRef.current) return;
    navRef.current = false;
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    setWidth(100);
    setPhase("done");
    if (clearRef.current) clearTimeout(clearRef.current);
    clearRef.current = setTimeout(() => { setPhase("hidden"); setWidth(0); }, 450);
    return () => { if (clearRef.current) clearTimeout(clearRef.current); };
  }, [pathname]);

  if (phase === "hidden") return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, pointerEvents: "none" }}>
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "var(--brand)",
          opacity: phase === "done" ? 0 : 1,
          transition: phase === "done"
            ? "width 0.12s ease-out, opacity 0.35s ease 0.05s"
            : "width 0.08s linear",
          boxShadow: "0 0 8px var(--brand)",
        }}
      />
    </div>
  );
}
