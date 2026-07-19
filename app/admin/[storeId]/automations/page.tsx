"use client";

import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";
import { useParams } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";

export default function AdminAutomationsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const { state } = useApp();
  
  const workflows = state.workflows.filter((w) => w.businessId === storeId);
  const wfIds = new Set(workflows.map((w) => w.id));
  const executions = state.executions.filter((e) => wfIds.has(e.workflowId));
  
  return (
    <div className="page-wrap animate-fade-in" style={{ padding: "40px 32px 100px" }}>
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div>
          <h1 style={{ color: "var(--ink)", fontWeight: 800 }}>Store Activity</h1>
          <p style={{ color: "var(--muted)", fontSize: 16 }}>An audit trail of recent events and actions.</p>
        </div>
      </div>
      
      <section className="card shadow-soft" style={{ overflow: "hidden" }}>
        {executions.length ? (
          <div className="table-wrap">
            <table className="table" style={{ width: "100%", minWidth: 600 }}>
              <thead style={{ background: "var(--surface)" }}>
                <tr>
                  <th style={{ padding: "16px 24px" }}>Activity</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {executions.map((execution) => {
                  const wf = state.workflows.find((item) => item.id === execution.workflowId);
                  return (
                    <tr key={execution.id}>
                      <td style={{ padding: "16px 24px" }}>
                        <strong style={{ color: "var(--ink)", display: "block", marginBottom: 4 }}>
                          {wf?.name || "Unknown event"}
                        </strong>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>
                          Via {execution.trigger.replaceAll("_", " ").toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={execution.status} />
                      </td>
                      <td style={{ fontSize: 13, color: "var(--muted)" }}>
                        {new Date(execution.startedAt).toLocaleString()}
                      </td>
                      <td style={{ paddingRight: 24, textAlign: "right" }}>
                        <Link className="btn btn-ghost" href={`/admin/${storeId}/automations/${execution.workflowId}`}>
                          View details <ArrowRight size={14} style={{ marginLeft: 4 }} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ padding: "80px 20px" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
              <Activity size={32} />
            </div>
            <h3 style={{ fontSize: 20, color: "var(--ink)", fontWeight: 700, margin: "0 0 8px" }}>No recent activity</h3>
            <p className="muted" style={{ fontSize: 15 }}>Run a scan or accept an order to see activity here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
