import type { ExecutionStatus, OrderStatus } from "@/types";

export function StatusBadge({ status }: { status: ExecutionStatus | OrderStatus | "published" | "unpublished" }) {
  const tone = status === "success" || status === "completed" || status === "published" || status === "accepted"
    ? "badge-green"
    : status === "failed" || status === "cancelled"
      ? "badge-red"
      : status === "waiting_for_human" || status === "running" || status === "new"
        ? "badge-amber"
        : "badge-gray";
  return <span className={`badge ${tone}`}>{status.replaceAll("_", " ")}</span>;
}
