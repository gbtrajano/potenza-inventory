"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Edit2, ArrowRightLeft, Trash2, ChevronLeft, ChevronRight, Filter, X, Package } from "lucide-react";
import { InventoryItem } from "@/lib/db";
import { LOJAS, TIPOS, DEPARTAMENTOS } from "@/lib/constants";

const TIPO_COLOR: Record<string, string> = {
  NOTEBOOK: "#3b82f6", IMPRESSORA: "#10b981", DESKTOP: "#8b5cf6",
  MONITOR: "#ec4899", TELEFONE: "#f59e0b", SWITCH: "#06b6d4",
  NOBREAK: "#84cc16", ROTEADOR: "#f97316", DVR: "#a78bfa",
};

export default function InventoryList({ onEdit, onTransfer, onRefresh, canEdit = true }: {
  onEdit: (item: InventoryItem) => void;
  onTransfer: (item: InventoryItem) => void;
  onRefresh: () => void;
  canEdit?: boolean;
}) {
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterLoja, setFilterLoja] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDep, setFilterDep] = useState("");
  const [filterModelo, setFilterModelo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [delConfirm, setDelConfirm] = useState<string | null>(null);
  const PER_PAGE = 20;

  // Derive available models from allItems filtered by tipo (if tipo selected)
  const availableModelos = Array.from(
    new Set(
      allItems
        .filter(i => !filterTipo || i.tipo === filterTipo)
        .map(i => i.modelo)
        .filter(Boolean)
    )
  ).sort();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterLoja) params.set("loja", filterLoja);
    if (filterTipo) params.set("tipo", filterTipo);
    if (filterDep) params.set("departamento", filterDep);
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();

    // Store all for modelo list derivation
    setAllItems(data.items);

    // Apply modelo filter client-side
    const filtered = filterModelo
      ? data.items.filter((i: InventoryItem) => i.modelo === filterModelo)
      : data.items;

    setTotal(filtered.length);
    const start = (page - 1) * PER_PAGE;
    setItems(filtered.slice(start, start + PER_PAGE));
    setLoading(false);
  }, [search, filterLoja, filterTipo, filterDep, filterModelo, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterLoja, filterTipo, filterDep, filterModelo]);

  // Reset modelo when tipo changes
  useEffect(() => { setFilterModelo(""); }, [filterTipo]);

  async function deleteItem(id: string) {
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    setDelConfirm(null);
    onRefresh();
    load();
  }

  const pages = Math.ceil(total / PER_PAGE);
  const activeFilterCount = [filterLoja, filterTipo, filterDep, filterModelo, search].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

  function clearFilters() {
    setFilterLoja(""); setFilterTipo(""); setFilterDep(""); setFilterModelo(""); setSearch(""); setPage(1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Search + Filter bar */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text2)" }} />
            <input
              className="input-field"
              style={{ paddingLeft: 32 }}
              placeholder="Buscar por patrimônio, usuário, modelo, série..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button className="btn-secondary" onClick={() => setShowFilters(f => !f)}>
            <Filter size={14} />
            Filtros
            {activeFilterCount > 0 && (
              <span style={{
                background: "var(--accent)", color: "#0a0c10",
                borderRadius: "50%", width: 18, height: 18, fontSize: 10,
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              }}>{activeFilterCount}</span>
            )}
          </button>

          {hasFilters && (
            <button className="btn-secondary" onClick={clearFilters}>
              <X size={14} /> Limpar
            </button>
          )}

          {/* ── CONTADOR DESTACADO ── */}
          <div style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.35)",
            borderRadius: 10,
            padding: "6px 14px",
          }}>
            <Package size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1, letterSpacing: -0.5 }}>
              {total.toLocaleString("pt-BR")}
            </span>
            <span style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.2 }}>
              {hasFilters ? "encontrado" : "item"}{total !== 1 ? "s" : ""}
              {hasFilters && <><br /><span style={{ color: "var(--accent)", fontSize: 10 }}>filtrado{total !== 1 ? "s" : ""}</span></>}
            </span>
          </div>
        </div>

        {showFilters && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Loja</div>
              <select className="input-field" value={filterLoja} onChange={e => setFilterLoja(e.target.value)}>
                <option value="">Todas</option>
                {LOJAS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Tipo</div>
              <select className="input-field" value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                <option value="">Todos</option>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Modelo {filterTipo && <span style={{ color: "var(--accent)" }}>({availableModelos.length})</span>}
              </div>
              <select
                className="input-field"
                value={filterModelo}
                onChange={e => setFilterModelo(e.target.value)}
                disabled={availableModelos.length === 0}
              >
                <option value="">Todos</option>
                {availableModelos.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Departamento</div>
              <select className="input-field" value={filterDep} onChange={e => setFilterDep(e.target.value)}>
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
                          {canEdit && <button title="Editar" onClick={() => onEdit(item)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }}><Edit2 size={14} /></button>}
                          {canEdit && <button title="Transferir" onClick={() => onTransfer(item)} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", padding: 4 }}><ArrowRightLeft size={14} /></button>}
                          {canEdit && (delConfirm === item.id ? (
                            <>
                              <button onClick={() => deleteItem(item.id)} style={{ background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Sim</button>
                              <button onClick={() => setDelConfirm(null)} style={{ background: "var(--bg3)", border: "none", color: "var(--text)", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Não</button>
                            </>
                          ) : (
                            <button title="Excluir" onClick={() => setDelConfirm(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
                          ))}
                          {!canEdit && <span style={{ color: "var(--text2)", fontSize: 11 }}>—</span>}
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
