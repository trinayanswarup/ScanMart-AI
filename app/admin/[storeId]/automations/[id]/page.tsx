"use client";

import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock3, Code, LoaderCircle, Play, X, Zap, Activity } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import type { WorkflowNodeExecution } from "@/types";

function NodeTrace({ node, last, devMode }: { node: WorkflowNodeExecution; last: boolean; devMode: boolean }) {
  const [open, setOpen] = useState(false);
  const Icon = node.status === "success" ? Check : node.status === "failed" ? X : node.status === "waiting_for_human" ? Clock3 : Circle;
  
  let friendlyName = node.nodeName;
  let friendlyDesc = `Completed at ${new Date(node.timestamp).toLocaleTimeString()}`;
  
  if (node.nodeName === "AI generated product description") {
    friendlyName = "AI drafted listing details";
  } else if (node.nodeName === "Draft listing created") {
    friendlyName = "Product record created";
  } else if (node.nodeName === "Waiting for seller approval") {
    friendlyName = "Pending your review";
    friendlyDesc = "Waiting for approval";
  }

  return (
    <div style={{ position: "relative", paddingLeft: 44, paddingBottom: last ? 0 : 32 }}>
      {!last && <i style={{ position: "absolute", top: 32, bottom: -8, left: 15, width: 2, background: "var(--line)" }} />}
      
      <div style={{ position: "absolute", left: 0, top: 0, width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: "50%", 
                    color: node.status === "success" ? "white" : node.status === "failed" ? "white" : "var(--amber)", 
                    background: node.status === "success" ? "var(--brand)" : node.status === "failed" ? "var(--danger)" : "rgba(245, 158, 11, 0.15)",
                    border: "2px solid var(--surface)", boxShadow: "0 0 0 1px var(--line)", zIndex: 2 }}>
        <Icon size={14} strokeWidth={3} />
      </div>
      
      <div>
        <strong style={{ fontSize: 15, color: "var(--ink)", display: "block" }}>{friendlyName}</strong>
        <span style={{ color: "var(--muted)", fontSize: 13, marginTop: 4, display: "block" }}>{friendlyDesc}</span>
        
        {devMode && (
          <div className="card" style={{ marginTop: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
            <button onClick={() => setOpen(!open)} style={{ width: "100%", border: 0, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", textAlign: "left", cursor: "pointer" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "flex", gap: 6, alignItems: "center" }}><Code size={14} /> Developer Log: {node.nodeType}</span>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {open && (
              <div style={{ borderTop: "1px solid var(--line)", padding: 14, background: "#0F172A", color: "#E2E8F0" }}>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "#94A3B8", marginBottom: 6, display: "block" }}>Input JSON</span>
                    <pre style={{ margin: 0, fontSize: 11, overflow: "auto", fontFamily: "monospace" }}>{JSON.stringify(node.input, null, 2)}</pre>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "#94A3B8", marginBottom: 6, display: "block" }}>Output JSON</span>
                    <pre style={{ margin: 0, fontSize: 11, overflow: "auto", fontFamily: "monospace" }}>{JSON.stringify(node.output ?? {}, null, 2)}</pre>
                  </div>
                </div>
                {node.error && <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#F87171", padding: 12, borderRadius: 6, marginTop: 12, fontSize: 12 }}>{node.error}</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAutomationDetailPage() {
  const { storeId, id } = useParams<{ storeId: string; id: string }>();
  const { state, approveWorkflowExecution } = useApp();
  const [devMode, setDevMode] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [approving, setApproving] = useState(false);
  
  const workflow = state.workflows.find((item) => item.id === id);
  const executions = state.executions.filter((item) => item.workflowId === id);
  const [selectedId, setSelectedId] = useState(executions[0]?.id);
  
  const selected = executions.find((item) => item.id === selectedId) || executions[0];

  const linkedInventoryItemId = selected?.nodes
    .find((n) => n.nodeType === "GENERATE_PRODUCT_DESCRIPTION" || n.nodeType === "CREATE_DRAFT_LISTING")
    ?.input?.inventoryItemId as string | undefined;
  const linkedItem = linkedInventoryItemId ? state.inventory.find((i) => i.id === linkedInventoryItemId) : undefined;

  if (!workflow) return <div className="page-wrap"><div className="empty">Activity not found.</div></div>;

  return (
    <div className="page-wrap animate-fade-in" style={{ padding: "40px 32px 100px" }}>
      <Link href={`/admin/${storeId}/automations`} className="btn btn-ghost" style={{ paddingLeft: 0, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Back to activity
      </Link>
      
      <div className="page-header" style={{ marginBottom: 40, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <h1 style={{ color: "var(--ink)", fontWeight: 800 }}>{workflow.name}</h1>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 16 }}>Activity log for {workflow.name.toLowerCase()}.</p>
        </div>
        <button className={`btn ${devMode ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDevMode(!devMode)}>
          <Code size={16} /> {devMode ? 'Disable Dev Mode' : 'Developer Mode'}
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1.3fr .7fr", gap: 32 }}>
        {/* Timeline Trace */}
        <section className="card shadow-soft" style={{ padding: 32, alignSelf: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 24, borderBottom: "1px solid var(--line)", marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--brand-soft)", color: "var(--brand)", display: "grid", placeItems: "center" }}>
                <Activity size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Activity Timeline</h2>
                <span className="muted" style={{ fontSize: 13, marginTop: 4, display: "block" }}>
                  {selected ? `Started ${new Date(selected.startedAt).toLocaleString()}` : "No run selected"}
                </span>
              </div>
            </div>
            {selected && <StatusBadge status={selected.status} />}
          </div>

          {selected ? (
            <>
              {selected.status === "waiting_for_human" && (
                <div style={{ background: "var(--brand-soft)", border: "1px solid var(--brand)", borderRadius: 8, padding: 24, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                  <div>
                    <strong style={{ fontSize: 16, color: "var(--brand)", display: "block", marginBottom: 6 }}>Action required</strong>
                    <p style={{ margin: 0, color: "var(--ink)", fontSize: 14, lineHeight: 1.5 }}>Review the draft listing, then approve it to publish the product.</p>
                  </div>
                  <button className="btn btn-primary shadow-glow" style={{ whiteSpace: "nowrap", opacity: approving ? 0.7 : 1 }} disabled={approving} onClick={async () => {
                    setApproving(true);
                    const result = await approveWorkflowExecution(selected.id);
                    setActionMessage(result.message);
                    setApproving(false);
                  }}>
                    {approving
                      ? <><LoaderCircle size={16} style={{ animation: "approve-spin 1s linear infinite" }} />Approving…</>
                      : <><CheckCircle2 size={16} /> Approve & publish</>}
                  </button>
                  <style>{`@keyframes approve-spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              
              {actionMessage && (
                <div style={{ background: actionMessage.includes("approved") ? "var(--brand-soft)" : "rgba(239, 68, 68, 0.1)", color: actionMessage.includes("approved") ? "var(--brand)" : "var(--danger)", padding: 16, borderRadius: 8, marginBottom: 32, fontSize: 14, fontWeight: 600 }}>
                  {actionMessage}
                  {actionMessage.includes("Set a product price") && linkedInventoryItemId && (
                    <div style={{ marginTop: 12 }}>
                      <Link
                        href={`/admin/${storeId}/products/${linkedInventoryItemId}`}
                        className="btn btn-secondary"
                        style={{ fontSize: 13 }}
                      >
                        {linkedItem ? `Set price for "${linkedItem.name}"` : "Go to product"} →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div style={{ paddingLeft: 10 }}>
                {selected.nodes.map((node, index) => (
                  <NodeTrace node={node} last={index === selected.nodes.length - 1} devMode={devMode} key={node.id} />
                ))}
              </div>
            </>
          ) : (
            <div className="empty" style={{ padding: "60px 20px" }}>
              <Activity size={40} color="var(--brand)" style={{ opacity: 0.2, margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 18, color: "var(--ink)", fontWeight: 700 }}>No timeline yet</h3>
              <p className="muted">The next matching event will appear here.</p>
            </div>
          )}
        </section>

        {/* History Sidebar */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {devMode && (
            <section className="card shadow-soft animate-fade-in" style={{ padding: 24, border: "1px solid var(--amber)", background: "var(--brand-soft)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 12 }}>System Details</h3>
              <div style={{ display: "grid", gap: 12, fontSize: 13, color: "var(--ink)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Trigger:</strong> <span>{workflow.triggerType}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>Nodes:</strong> <span>{workflow.nodeNames.length} defined</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><strong>ID:</strong> <span>{workflow.id.slice(0, 8)}...</span></div>
              </div>
            </section>
          )}
          
          <section className="card shadow-soft" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginBottom: 16 }}>Event History</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {executions.length ? executions.map((execution) => (
                <button key={execution.id} onClick={() => setSelectedId(execution.id)} 
                        style={{ padding: "12px 16px", textAlign: "left", borderRadius: 8, border: "1px solid",
                                 borderColor: selected?.id === execution.id ? "var(--brand)" : "var(--line)",
                                 background: selected?.id === execution.id ? "var(--brand-soft)" : "var(--surface)", cursor: "pointer", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: selected?.id === execution.id ? "var(--brand)" : "var(--ink)" }}>
                      {new Date(execution.startedAt).toLocaleDateString()}
                    </strong>
                    <StatusBadge status={execution.status} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(execution.startedAt).toLocaleTimeString()}
                  </span>
                </button>
              )) : (
                <p className="muted" style={{ fontSize: 13 }}>No other events recorded.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
