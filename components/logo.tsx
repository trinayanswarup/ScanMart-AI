import Link from "next/link";
import { ScanLine } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 850, letterSpacing: "-.03em" }}>
      <span style={{ width: 34, height: 34, borderRadius: 5, display: "grid", placeItems: "center", color: "white", background: "#2C645B" }}><ScanLine size={19} /></span>
      {!compact && <span>ScanMart <span style={{ color: "#2C645B" }}>AI</span></span>}
    </Link>
  );
}


