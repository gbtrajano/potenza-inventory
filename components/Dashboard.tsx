"use client";
import { useEffect, useState } from "react";
import { Package, AlertTriangle, Clock, TrendingUp, Monitor, Printer, Laptop, Phone } from "lucide-react";

interface Stats {
  totalItems: number;
  byTipo: Record<string, number>;
  byLoja: Record<string, number>;
  byDepartamento: Record<string, number>;
  semUsuario: number;
  semPatrimonio: number;
  recentItems: number;
  recentHistory: any[];
  totalHistory: number;
}

export default function Dashboard({ onNavigate }: { onNavigate: (p: any) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory/stats").then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text2)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, marginTop: 12 }}>Carregando dados...</div>
      </div>
    </div>
  );

  if (!stats) return null;

  const topTipos = Object.entries(stats.byTipo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topLojas = Object.entries(stats.byLoja).sort((a, b) => b[1] - a[1]);
  const maxLoja = Math.max(...topLojas.map(([, v]) => v), 1);

  const tipoIcon: Record<string, React.ReactNode> = {
    NOTEBOOK: <Laptop size={14} />, IMPRESSORA: <Printer size={14} />,
    MONITOR: <Monitor size={14} />, TELEFONE: <Phone size={14} />,
  };

  const tipoBadge: Record<string, string> = {
    NOTEBOOK: "#3b82f6", IMPRESSORA: "#10b981", DESKTOP: "#8b5cf6",
    MONITOR: "#ec4899", TELEFONE: "#f59e0b", SWITCH: "#06b6d4",
    NOBREAK: "#84cc16", ROTEADOR: "#f97316",
  };

  const actionLabels: Record<string, string> = {
    create: "Cadastrado", update: "Atualizado", delete: "Removido", transfer: "Transferido"
  };
  const actionColors: Record<string, string> = {
    create: "#10b981", update: "#3b82f6", delete: "#ef4444", transfer: "#f59e0b"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {[
          { label: "Total de Itens", value: stats.totalItems, icon: <Package size={20} />, color: "#f59e0b", sub: `${stats.recentItems} adicionados (30d)` },
          { label: "Tipos Cadastrados", value: Object.keys(stats.byTipo).length, icon: <Monitor size={20} />, color: "#3b82f6", sub: `${topTipos[0]?.[0] || "—"} é o mais comum` },
          { label: "Sem Usuário", value: stats.semUsuario, icon: <AlertTriangle size={20} />, color: "#ef4444", sub: "Notebooks/Desktops/Tablets" },
          { label: "Sem Patrimônio", value: stats.semPatrimonio, icon: <AlertTriangle size={20} />, color: "#f97316", sub: "Itens sem tombamento" },
          { label: "Lojas Ativas", value: Object.keys(stats.byLoja).length, icon: <TrendingUp size={20} />, color: "#10b981", sub: "Com equipamentos" },
          { label: "Alterações", value: stats.totalHistory, icon: <Clock size={20} />, color: "#8b5cf6", sub: "Registros no histórico" },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card" style={{ cursor: "pointer" }} onClick={() => onNavigate("inventory")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ color: "var(--text2)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{kpi.label}</div>
              <div style={{ color: kpi.color, opacity: 0.7 }}>{kpi.icon}</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* By Tipo */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>Por Tipo de Equipamento</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topTipos.map(([tipo, count]) => {
              const pct = Math.round((count / stats.totalItems) * 100);
              const color = tipoBadge[tipo] || "#6b7280";
              return (
                <div key={tipo}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color }}>{tipoIcon[tipo] || <Package size={14} />}</span>
                      <span style={{ color: "var(--text)" }}>{tipo}</span>
                    </div>
                    <span style={{ color: "var(--text2)" }}>{count} <span style={{ color }}>{pct}%</span></span>
                  </div>
                  <div style={{ height: 5, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            {topTipos.length === 0 && <div style={{ color: "var(--text2)", fontSize: 12, textAlign: "center", padding: 20 }}>Nenhum item cadastrado</div>}
          </div>
        </div>

        {/* By Loja */}
        <div className="card">
          <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>Por Loja</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topLojas.map(([loja, count]) => (
              <div key={loja} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", width: 130, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={loja}>{loja}</div>
                <div style={{ flex: 1, height: 20, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / maxLoja) * 100}%`, background: "linear-gradient(90deg, #f59e0b, #d97706)", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 6 }}>
                    <span style={{ fontSize: 10, color: "#0a0c10", fontWeight: 700 }}>{count}</span>
                  </div>
                </div>
              </div>
            ))}
            {topLojas.length === 0 && <div style={{ color: "var(--text2)", fontSize: 12, textAlign: "center", padding: 20 }}>Nenhum item cadastrado</div>}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 13, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>Atividade Recente</h3>
          <button className="btn-secondary" style={{ fontSize: 11, padding: "5px 12px" }} onClick={() => onNavigate("history")}>Ver Tudo</button>
        </div>
        {stats.recentHistory.length === 0 ? (
          <div style={{ color: "var(--text2)", fontSize: 12, textAlign: "center", padding: 30 }}>Nenhuma atividade registrada</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {stats.recentHistory.slice(0, 10).map((h: any) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                <span style={{ width: 80, flexShrink: 0, padding: "2px 6px", borderRadius: 4, background: `${actionColors[h.action]}22`, color: actionColors[h.action], fontSize: 10, fontWeight: 700, textAlign: "center" }}>
                  {actionLabels[h.action] || h.action}
                </span>
                <span style={{ color: "var(--text)", flex: 1 }}>{h.observacao || `${h.item_tipo} — ${h.item_patrimonio}`}</span>
                <span style={{ color: "var(--text2)", fontSize: 10, whiteSpace: "nowrap" }}>{new Date(h.timestamp).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dept breakdown */}
      {Object.keys(stats.byDepartamento).length > 0 && (
        <div className="card">
          <h3 style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 }}>Por Departamento</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(stats.byDepartamento).sort((a, b) => b[1] - a[1]).map(([dep, count]) => (
              <div key={dep} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", fontSize: 11 }}>
                <span style={{ color: "var(--text2)" }}>{dep}</span>
                <span style={{ color: "var(--accent)", marginLeft: 6, fontWeight: 700 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
