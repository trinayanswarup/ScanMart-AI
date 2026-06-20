"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Circle, Clock3, Play, X, Zap } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { StatusBadge } from "@/components/status-badge";
import type { WorkflowNodeExecution } from "@/types";

function NodeTrace({ node, last }: { node: WorkflowNodeExecution; last: boolean }) {
  const [open, setOpen] = useState(false);
  const Icon = node.status === "success" ? Check : node.status === "failed" ? X : node.status === "waiting_for_human" ? Clock3 : Circle;
  return <div style={{ position: "relative", paddingLeft: 52, paddingBottom: last ? 0 : 24 }}>
    {!last && <i style={{ position: "absolute", top: 35, bottom: -4, left: 17, width: 1, background: "#dce4de" }} />}
    <div style={{ position: "absolute", left: 0, top: 0, width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 10, color: node.status === "success" ? "#2C645B" : node.status === "failed" ? "#F85458" : "#9D552C", background: node.status === "success" ? "#F6F6F6" : node.status === "failed" ? "#fff0ef" : "#fff5df", border: "3px solid white", boxShadow: "0 0 0 1px #dfe6e1" }}><Icon size={16} /></div>
    <div className="subtle-card" style={{ overflow: "hidden" }}><button onClick={() => setOpen(!open)} style={{ width: "100%", border: 0, background: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 15, textAlign: "left" }}><div><strong style={{ fontSize: 13 }}>{node.nodeName}</strong><span className="muted" style={{ display: "block", fontSize: 10, marginTop: 4 }}>{node.nodeType.replaceAll("_", " ")} · {new Date(node.timestamp).toLocaleTimeString()}</span></div><div style={{ display: "flex", alignItems: "center", gap: 9 }}><StatusBadge status={node.status} />{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</div></button>{open && <div style={{ borderTop: "1px solid #e3e8e4", padding: 15 }}><div className="grid-2"><div><span className="label">Input JSON</span><pre style={{ margin: 0, background: "#092922", color: "#cde5d6", borderRadius: 10, padding: 13, overflow: "auto", fontSize: 10 }}>{JSON.stringify(node.input, null, 2)}</pre></div><div><span className="label">Output JSON</span><pre style={{ margin: 0, background: "#092922", color: "#cde5d6", borderRadius: 10, padding: 13, overflow: "auto", fontSize: 10 }}>{JSON.stringify(node.output ?? {}, null, 2)}</pre></div></div>{node.error && <div className="error-text">{node.error}</div>}</div>}</div>
  </div>;
}

export default function AutomationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const workflow = state.workflows.find((item) => item.id === id);
  const executions = state.executions.filter((item) => item.workflowId === id);
  const [selectedId, setSelectedId] = useState(executions[0]?.id);
  const selected = executions.find((item) => item.id === selectedId) || executions[0];
  if (!workflow) return <div className="page-wrap"><div className="empty">Workflow not found.</div></div>;
  return <div className="page-wrap"><Link href="/automations" className="btn btn-ghost" style={{ paddingLeft: 0 }}><ArrowLeft size={16} />Back to automations</Link><div className="page-header" style={{ marginTop: 12 }}><div><div style={{ display: "flex", gap: 10, alignItems: "center" }}><h1>{workflow.name}</h1><span className="badge badge-green">Active</span></div><p>{workflow.description}</p></div><button className="btn btn-secondary" onClick={() => alert("This workflow runs automatically when its trigger occurs.")}><Play size={15} />Manual run info</button></div>
    <div className="grid-2" style={{ gridTemplateColumns: ".7fr 1.3fr" }}><aside style={{ display: "grid", gap: 18, alignContent: "start" }}><section className="card" style={{ padding: 20 }}><h2 className="section-title">Workflow definition</h2><div style={{ marginTop: 18 }}><span className="label">Trigger</span><span className="badge badge-gray">{workflow.triggerType.replaceAll("_", " ")}</span></div><div style={{ marginTop: 20 }}><span className="label">Sequential nodes</span><div style={{ display: "grid", gap: 8 }}>{workflow.nodeNames.map((name, index) => <div className="subtle-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 10, fontSize: 11 }} key={name}><span style={{ width: 24, height: 24, borderRadius: 7, background: "#F6F6F6", color: "#2C645B", display: "grid", placeItems: "center", fontWeight: 800 }}>{index + 1}</span>{name}</div>)}</div></div></section><section className="card" style={{ padding: 20 }}><h2 className="section-title">Execution history</h2><div style={{ display: "grid", gap: 8, marginTop: 16 }}>{executions.length ? executions.map((execution) => <button key={execution.id} onClick={() => setSelectedId(execution.id)} className="subtle-card" style={{ padding: 12, textAlign: "left", borderColor: selected?.id === execution.id ? "#2C645B" : undefined, background: selected?.id === execution.id ? "#F6F6F6" : undefined }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong style={{ fontSize: 11 }}>{new Date(execution.startedAt).toLocaleString()}</strong><StatusBadge status={execution.status} /></div><span className="muted" style={{ fontSize: 9 }}>{execution.nodes.length} node executions</span></button>) : <p className="muted" style={{ fontSize: 12 }}>No executions yet. Trigger this workflow through the product flow.</p>}</div></section></aside>
    <section className="card" style={{ padding: 24, alignSelf: "start" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20, borderBottom: "1px solid #e5eae6", marginBottom: 24 }}><div><div style={{ display: "flex", gap: 9, alignItems: "center" }}><div className="empty-icon" style={{ margin: 0, width: 38, height: 38 }}><Zap size={18} /></div><div><h2 className="section-title">Execution trace</h2><span className="muted" style={{ fontSize: 10 }}>{selected ? `Started ${new Date(selected.startedAt).toLocaleString()}` : "No run selected"}</span></div></div></div>{selected && <StatusBadge status={selected.status} />}</div>
      {selected ? <><div className="notice" style={{ marginBottom: 24 }}><strong>Trigger received:</strong> {selected.trigger.replaceAll("_", " ")}. Every action below was persisted as it ran.</div>{selected.nodes.map((node, index) => <NodeTrace node={node} last={index === selected.nodes.length - 1} key={node.id} />)}</> : <div className="empty"><div className="empty-icon"><Zap /></div><h3>No execution trace yet</h3><p className="muted">The next matching business event will appear here step by step.</p></div>}</section></div>
  </div>;
}

