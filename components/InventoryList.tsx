"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Edit2, ArrowRightLeft, Trash2, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { InventoryItem } from "@/lib/db";
import { LOJAS, TIPOS, DEPARTAMENTOS } from "@/lib/constants";

const TIPO_COLOR: Record<string, string> = {
  NOTEBOOK: "#3b82f6", IMPRESSORA: "#10b981", DESKTOP: "#8b5cf6",
  MONITOR: "#ec4899", TELEFONE: "#f59e0b", SWITCH: "#06b6d4",
  NOBREAK: "#84cc16", ROTEADOR: "#f97316", DVR: "#a78bfa",
};

export default function InventoryList({ onEdit, onTransfer, onRefresh }: {
  onEdit: (item: InventoryItem) => void;
  onTransfer: (item: InventoryItem) => void;
  onRefresh: () => void;
}) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterLoja, setFilterLoja] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterLoja) params.set("loja", filterLoja);
    if (filterTipo) params.set("tipo", filterTipo);
    if (filterDep) params.set("departamento", filterDep);
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setTotal(data.total);
    const start = (page - 1) * PER_PAGE;
    setItems(data.items.slice(start, start + PER_PAGE));
    setLoading(false);
  }, [search, filterLoja, filterTipo, filterDep, page]);

  useEffect(() => { load(); }, [load]);

  async function deleteItem(id: string) {
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    setDelConfirm(null);
    onRefresh();
    load();
  }

  const pages = Math.ceil(total / PER_PAGE);
  const hasFilters = !!(filterLoja || filterTipo || filterDep || search);

  function clearFilters() {
    setFilterLoja(""); setFilterTipo(""); setFilterDep(""); setSearch(""); setPage(1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search + Filter bar */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text2)" }} />
            <input className="input-field" style={{ paddingLeft: 32 }} placeholder="Buscar por patrimônio, usuário, modelo, série..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <button className="btn-secondary" onClick={() => setShowFilters(f => !f)} style={{ gap: 6 }}>
            <Filter size={14} /> Filtros {hasFilters && <span style={{ background: "var(--accent)", color: "#0a0c10", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>!</span>}
          </button>
          {hasFilters && <button className="btn-secondary" onClick={clearFilters}><X size={14} /> Limpar</button>}
          <div style={{ color: "var(--text2)", fontSize: 12, marginLeft: "auto" }}>{total} item{total !== 1 ? "s" : ""}</div>
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>LOJA</div>
              <select className="input-field" value={filterLoja} onChange={e => { setFilterLoja(e.target.value); setPage(1); }}>
                <option value="">Todas</option>
                {LOJAS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>TIPO</div>
              <select className="input-field" value={filterTipo} onChange={e => { setFilterTipo(e.target.value); setPage(1); }}>
                <option value="">Todos</option>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>DEPARTAMENTO</div>
              <select className="input-field" value={filterDep} onChange={e => { setFilterDep(e.target.value); setPage(1); }}>
                <option value="">Todos</option>
                {DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text2)", fontSize: 13 }}>Carregando...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text2)", fontSize: 13 }}>
              {hasFilters ? "Nenhum item encontrado com esses filtros" : "Nenhum item cadastrado ainda"}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>PATRIMÔNIO</th>
                  <th>TIPO</th>
                  <th>LOJA</th>
                  <th>DEPARTAMENTO</th>
                  <th>LOCALIZAÇÃO</th>
                  <th>MODELO</th>
                  <th>USUÁRIO</th>
                  <th>IP</th>
                  <th>OBS.</th>
                  <th style={{ textAlign: "center" }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const color = TIPO_COLOR[item.tipo] || "#6b7280";
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap" }}>
                        {item.patrimonio || <span style={{ color: "var(--text2)" }}>—</span>}
                        {item.patrimonio_antigo && <div style={{ fontSize: 10, color: "var(--text2)" }}>{item.patrimonio_antigo}</div>}
                      </td>
                      <td>
                        <span style={{ background: `${color}22`, color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{item.tipo}</span>
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{item.loja}</td>
                      <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>{item.departamento}</td>
                      <td style={{ fontSize: 11, color: "var(--text2)" }}>{item.localizacao || "—"}</td>
                      <td style={{ fontSize: 12 }}>{item.modelo || "—"}</td>
                      <td style={{ fontSize: 12 }}>
                        {item.usuario || <span style={{ color: "var(--text2)" }}>—</span>}
                        {item.cargo && <div style={{ fontSize: 10, color: "var(--text2)" }}>{item.cargo}</div>}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: "monospace", color: item.ip ? "#10b981" : "var(--text2)" }}>{item.ip || "—"}</td>
                      <td style={{ fontSize: 11, color: "var(--text2)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.observacao}>{item.observacao || "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button title="Editar" onClick={() => onEdit(item)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }}><Edit2 size={14} /></button>
                          <button title="Transferir" onClick={() => onTransfer(item)} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", padding: 4 }}><ArrowRightLeft size={14} /></button>
                          {delConfirm === item.id ? (
                            <>
                              <button onClick={() => deleteItem(item.id)} style={{ background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Sim</button>
                              <button onClick={() => setDelConfirm(null)} style={{ background: "var(--bg3)", border: "none", color: "var(--text)", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Não</button>
                            </>
                          ) : (
                            <button title="Excluir" onClick={() => setDelConfirm(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <button className="btn-secondary" style={{ padding: "5px 10px" }} disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid", borderColor: page === p ? "var(--accent)" : "var(--border)", background: page === p ? "rgba(245,158,11,0.12)" : "var(--bg3)", color: page === p ? "var(--accent)" : "var(--text2)", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{p}</button>
              );
            })}
            <button className="btn-secondary" style={{ padding: "5px 10px" }} disabled={page === pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
