"use client";
import { useEffect, useState } from "react";
import { 
  Package, AlertTriangle, TrendingUp, DollarSign, AlertCircle, 
  CheckCircle2, Store, UserX, Info, Activity, ArrowRight
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell 
} from "recharts";

interface Stats {
  totalItems: number;
  byTipo: Record<string, number>;
  byLoja: Record<string, number>;
  byDepartamento: Record<string, number>;
  semUsuario: number;
  semPatrimonio: number;
  regularizados: number;
  alerts: { message: string; severity: 'critical' | 'warning' | 'info' }[];
  recentItems: number;
  recentHistory: any[];
  totalHistory: number;
}

export type InventoryQuickFilter = "semUsuario" | "semPatrimonio";

export default function Dashboard({ onNavigate }: { onNavigate: (p: "inventory", filter?: InventoryQuickFilter) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory/stats").then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--text2)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, marginTop: 12 }}>Carregando dados executivos...</div>
      </div>
    </div>
  );

  if (!stats) return null;

  const taxaRegularizacao = stats.totalItems ? ((stats.regularizados / stats.totalItems) * 100).toFixed(1) : "0.0";
  
  const lojaData = Object.entries(stats.byLoja)
    .map(([name, count]) => ({ name: name.replace('POTENZA-', ''), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8

  const statusData = [
    { name: 'Regularizados', value: stats.regularizados, color: '#10b981' }, 
    { name: 'Sem Patrimônio', value: stats.semPatrimonio, color: '#f59e0b' },
    { name: 'Sem Usuário', value: stats.semUsuario, color: '#ef4444' }, 
  ].filter(d => d.value > 0);

  const cardStyle = {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
    cursor: "default"
  };

  const hoverCardStyle = {
    ...cardStyle,
    cursor: "pointer",
    transition: "border-color 0.2s"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400, margin: "0 auto", width: "100%", paddingBottom: 40 }}>
      
      {/* 1. KPIs Grandes Executivos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Card 1: Total Ativos */}
        <div 
          style={hoverCardStyle} 
          onClick={() => onNavigate("inventory")}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ color: "var(--text2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Total de Ativos</span>
            <Package size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1 }}>{stats.totalItems}</div>
          <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
            <span style={{ color: "#10b981", marginRight: 4 }}>+{stats.recentItems}</span>
            adicionados (30d)
          </div>
        </div>

        {/* Card 2: Taxa de Regularização */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ color: "var(--text2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Regularizados</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#10b981", marginBottom: 8, lineHeight: 1 }}>{taxaRegularizacao}%</div>
          <div style={{ width: "100%", background: "var(--bg3)", borderRadius: 999, height: 6, marginTop: 12, overflow: "hidden" }}>
            <div style={{ background: "#10b981", height: 6, borderRadius: 999, width: `${taxaRegularizacao}%` }}></div>
          </div>
        </div>

        {/* Card 3: Sem Usuário */}
        <div 
          style={hoverCardStyle} 
          onClick={() => onNavigate("inventory", "semUsuario")}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ color: "var(--text2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Sem Usuário</span>
            <UserX size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#ef4444", marginBottom: 8, lineHeight: 1 }}>{stats.semUsuario}</div>
          <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 500 }}>
            Notebooks/Desktops/Tablets
          </div>
        </div>

        {/* Card 4: Sem Patrimônio */}
        <div 
          style={hoverCardStyle} 
          onClick={() => onNavigate("inventory", "semPatrimonio")}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.5)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ color: "var(--text2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Sem Patrimônio</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b", marginBottom: 8, lineHeight: 1 }}>{stats.semPatrimonio}</div>
          <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 500 }}>
            Itens pendentes
          </div>
        </div>

        {/* Card 5: Lojas Ativas */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ color: "var(--text2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Lojas Ativas</span>
            <Store size={18} color="var(--text2)" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8, lineHeight: 1 }}>{Object.keys(stats.byLoja).length}</div>
          <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>Todas operando normal</div>
        </div>
      </div>

      {/* 2. Grid Central (Gráficos) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        {/* Esquerda: Gráfico de Barras */}
        <div style={{ ...cardStyle, flex: 2 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} color="#3b82f6"/> Volume por Loja (Top 8)
          </h3>
          <div style={{ height: 280, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lojaData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text2)" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{fill: 'var(--bg3)'}}
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direita: Donut Chart */}
        <div style={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 16px 0" }}>Status Geral</h3>
          <div style={{ flex: 1, minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
                  itemStyle={{ color: 'var(--text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: s.color }}></div>
                  <span style={{ color: "var(--text)" }}>{s.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Ações Necessárias */}
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ background: "var(--bg3)", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Ações Necessárias / Pendências Críticas</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {stats.alerts.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text2)", fontSize: 14 }}>Nenhum alerta crítico no momento. O inventário está saudável.</div>
          ) : (
            stats.alerts.map((alert, i) => (
              <div key={i} style={{ padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: 16, borderBottom: i < stats.alerts.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.2s", cursor: "default" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ marginTop: 2 }}>
                  {alert.severity === 'critical' ? <AlertTriangle size={18} color="#ef4444" /> : 
                   alert.severity === 'warning' ? <AlertCircle size={18} color="#f59e0b" /> : 
                   <Info size={18} color="#3b82f6" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: alert.severity === 'critical' ? '#f87171' : alert.severity === 'warning' ? '#fbbf24' : '#60a5fa' }}>
                    {alert.severity === 'critical' ? 'Atenção Crítica' : alert.severity === 'warning' ? 'Aviso Importante' : 'Informação'}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text)" }}>{alert.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
