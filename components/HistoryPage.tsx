"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ACTION_LABELS: Record<string, string> = { create: "Cadastro", update: "Atualização", delete: "Remoção", transfer: "Transferência" };
const ACTION_COLORS: Record<string, string> = { create: "#10b981", update: "#3b82f6", delete: "#ef4444", transfer: "#f59e0b" };

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const PER = 30;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/inventory/history?limit=${PER}&offset=${(page - 1) * PER}`).then(r => r.json()).then(d => {
      setHistory(d.history);
      setTotal(d.total);
      setLoading(false);
    });
  }, [page]);

  const pages = Math.ceil(total / PER);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Histórico de Alterações</h2>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{total} registros no total</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text2)" }}>Carregando...</div>
        ) : history.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text2)", fontSize: 13 }}>Nenhum histórico registrado</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>DATA/HORA</th>
                <th>AÇÃO</th>
                <th>PATRIMÔNIO</th>
                <th>TIPO</th>
                <th>LOJA</th>
                <th>DETALHES</th>
                <th>OPERADOR</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id}>
                  <td style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{new Date(h.timestamp).toLocaleString("pt-BR")}</td>
                  <td>
                    <span style={{ background: `${ACTION_COLORS[h.action]}22`, color: ACTION_COLORS[h.action], padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {ACTION_LABELS[h.action] || h.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--accent)" }}>{h.item_patrimonio || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{h.item_tipo || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{h.item_loja || "—"}</td>
                  <td style={{ fontSize: 11, maxWidth: 280 }}>
                    {h.observacao && <div style={{ color: "var(--text2)" }}>{h.observacao}</div>}
                    {h.changes && Object.keys(h.changes).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: h.observacao ? 4 : 0 }}>
                        {Object.entries(h.changes).slice(0, 3).map(([field, change]: [string, any]) => (
                          <span key={field} style={{ fontSize: 10, background: "var(--bg3)", borderRadius: 4, padding: "1px 6px" }}>
                            <span style={{ color: "var(--text2)" }}>{field}:</span>{" "}
                            <span style={{ color: "#ef4444" }}>{change.from || "—"}</span>{" → "}
                            <span style={{ color: "#10b981" }}>{change.to || "—"}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text2)" }}>{h.usuario_operacao || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <button className="btn-secondary" style={{ padding: "5px 10px" }} disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 12, color: "var(--text2)" }}>Página {page} de {pages}</span>
            <button className="btn-secondary" style={{ padding: "5px 10px" }} disabled={page === pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
