"use client";
import { useEffect, useState, useRef } from "react";
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export default function DatabasePage({ onDone }: { onDone: () => void }) {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const restoreRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetch("/api/db").then(r => r.json()).then(d => { setInfo(d); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function clearHistory() {
    await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear_history" }) });
    setConfirmClear(false);
    setStatus({ type: "success", msg: "Histórico limpo com sucesso." });
    onDone(); load();
  }

  async function clearAll() {
    await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear_all", confirmed: true }) });
    setConfirmClearAll(false);
    setStatus({ type: "success", msg: "Banco de dados limpo com sucesso." });
    onDone(); load();
  }

  function backup() { window.open("/api/db?action=backup"); }

  function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const backup = JSON.parse(ev.target?.result as string);
        const res = await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", backup }) });
        const data = await res.json();
        if (data.success) {
          setStatus({ type: "success", msg: `Restaurado: ${data.items} itens importados.` });
          onDone(); load();
        } else {
          setStatus({ type: "error", msg: data.error || "Erro ao restaurar." });
        }
      } catch {
        setStatus({ type: "error", msg: "Arquivo inválido." });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {status && (
        <div style={{ background: status.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${status.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          {status.type === "success" ? <CheckCircle size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
          <span style={{ fontSize: 13 }}>{status.msg}</span>
          <button onClick={() => setStatus(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* DB Info */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Database size={18} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Informações do Banco de Dados</h3>
          <button onClick={load} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><RefreshCw size={14} /></button>
        </div>
        {loading ? (
          <div style={{ color: "var(--text2)", fontSize: 12 }}>Carregando...</div>
        ) : info && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Total de Itens", value: info.total_items },
              { label: "Registros no Histórico", value: info.total_history },
              { label: "Tamanho do Arquivo", value: `${info.file_size_kb} KB` },
              { label: "Versão do Schema", value: `v${info.schema_version}` },
              { label: "Última Modificação", value: info.last_modified ? new Date(info.last_modified).toLocaleString("pt-BR") : "—" },
              { label: "Caminho do Arquivo", value: info.db_path?.replace(process.env.HOME || "", "~") || "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--bg3)", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, wordBreak: "break-all" }}>{String(value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup / Restore */}
      <div className="card">
        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Backup e Restauração</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text2)" }}>Faça backup do banco de dados completo (incluindo histórico) ou restaure a partir de um backup anterior.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" onClick={backup}><Download size={14} /> Fazer Backup (.db)</button>
          <button className="btn-secondary" onClick={() => restoreRef.current?.click()}><Upload size={14} /> Restaurar Backup</button>
          <input ref={restoreRef} type="file" accept=".db,.json" style={{ display: "none" }} onChange={handleRestore} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#ef4444" }}>⚠️ Zona de Perigo</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text2)" }}>Ações irreversíveis. Faça um backup antes de prosseguir.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {!confirmClear ? (
            <button className="btn-danger" onClick={() => setConfirmClear(true)}><Trash2 size={14} /> Limpar Histórico</button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#ef4444" }}>Confirmar limpeza do histórico?</span>
              <button onClick={clearHistory} style={{ background: "#ef4444", border: "none", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sim, limpar</button>
              <button className="btn-secondary" onClick={() => setConfirmClear(false)}>Não</button>
            </div>
          )}
          {!confirmClearAll ? (
            <button className="btn-danger" onClick={() => setConfirmClearAll(true)}><Trash2 size={14} /> Limpar Tudo</button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#ef4444" }}>⚠️ Apagar TODO o inventário?</span>
              <button onClick={clearAll} style={{ background: "#ef4444", border: "none", color: "#fff", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Sim, apagar tudo</button>
              <button className="btn-secondary" onClick={() => setConfirmClearAll(false)}>Não</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
