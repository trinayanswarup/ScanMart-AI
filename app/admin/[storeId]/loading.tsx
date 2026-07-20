export default function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid var(--line)", borderTopColor: "var(--brand)", animation: "spin 0.75s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
