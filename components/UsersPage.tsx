"use client";
import { useEffect, useState } from "react";
import { UserPlus, Edit2, Trash2, ShieldCheck, Eye, EyeOff, RefreshCw, X, Check, Key } from "lucide-react";

interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  active: boolean;
  created_at: string;
  last_login?: string;
}

const ROLE_INFO = {
  admin:  { label: "Administrador", color: "#f59e0b", desc: "Acesso total — gerencia usuários, banco de dados e inventário" },
  editor: { label: "Editor",        color: "#3b82f6", desc: "Pode adicionar, editar, transferir e importar itens" },
  viewer: { label: "Visualizador",  color: "#6b7280", desc: "Apenas visualização — sem permissão de edição" },
};

type ModalMode = "create" | "edit" | "password" | null;

const EMPTY_FORM = { username: "", name: "", role: "editor" as UserRecord["role"], password: "", confirm: "", active: true };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [delConfirm, setDelConfirm] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/auth/users").then(r => r.json()).then(d => {
      setUsers(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError(""); setSuccess("");
    setModal("create");
  }
  function openEdit(u: UserRecord) {
    setEditing(u);
    setForm({ username: u.username, name: u.name, role: u.role, password: "", confirm: "", active: u.active });
    setError(""); setSuccess("");
    setModal("edit");
  }
  function openPassword(u: UserRecord) {
    setEditing(u);
    setForm({ ...EMPTY_FORM, username: u.username });
    setError(""); setSuccess("");
    setModal("password");
  }
  function closeModal() { setModal(null); setEditing(null); setError(""); }

  async function saveCreate() {
    if (!form.username || !form.name || !form.password) { setError("Preencha todos os campos."); return; }
    if (form.password !== form.confirm) { setError("As senhas não coincidem."); return; }
    if (form.password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", username: form.username, name: form.name, role: form.role, password: form.password }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Erro ao criar usuário."); return; }
    setSuccess(`Usuário "${form.name}" criado com sucesso.`);
    closeModal(); load();
  }

  async function saveEdit() {
    if (!editing) return;
    if (!form.name) { setError("Nome é obrigatório."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: editing.id, name: form.name, role: form.role, active: form.active }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Erro ao atualizar."); return; }
    closeModal(); load();
    setSuccess(`Usuário "${form.name}" atualizado.`);
  }

  async function savePassword() {
    if (!editing) return;
    if (!form.password || form.password !== form.confirm) { setError("Senhas não coincidem ou estão vazias."); return; }
    if (form.password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id: editing.id, password: form.password }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Erro ao alterar senha."); return; }
    closeModal();
    setSuccess(`Senha de "${editing.name}" alterada com sucesso.`);
  }

  async function deleteUser(id: string) {
    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = await res.json();
    setDelConfirm(null);
    if (!res.ok) { setSuccess(""); setError(data.error || "Erro ao remover."); return; }
    load();
    setSuccess("Usuário removido.");
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Feedback */}
      {success && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <Check size={14} color="#10b981" /> <span style={{ color: "#10b981" }}>{success}</span>
          <button onClick={() => setSuccess("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}
      {error && !modal && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Gerenciar Usuários</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text2)" }}>Controle de acesso ao sistema de inventário</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-secondary" onClick={load}><RefreshCw size={14} /></button>
            <button className="btn-primary" onClick={openCreate}><UserPlus size={14} /> Novo Usuário</button>
          </div>
        </div>

        {/* Role legend */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(ROLE_INFO).map(([key, info]) => (
            <div key={key} style={{ background: "var(--bg3)", border: `1px solid ${info.color}33`, borderRadius: 8, padding: "8px 14px", flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: info.color, marginBottom: 3 }}>{info.label}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{info.desc}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--text2)", padding: 30, fontSize: 13 }}>Carregando...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>USUÁRIO</th>
                  <th>NOME</th>
                  <th>PERFIL</th>
                  <th>STATUS</th>
                  <th>ÚLTIMO ACESSO</th>
                  <th>CRIADO EM</th>
                  <th style={{ textAlign: "center" }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const ri = ROLE_INFO[u.role];
                  return (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>@{u.username}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td>
                        <span style={{ background: `${ri.color}22`, color: ri.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                          {ri.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ background: u.active ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.12)", color: u.active ? "#10b981" : "#6b7280", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                          {u.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text2)" }}>
                        {u.last_login ? new Date(u.last_login).toLocaleString("pt-BR") : "Nunca"}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text2)" }}>
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button title="Editar" onClick={() => openEdit(u)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 4 }}><Edit2 size={14} /></button>
                          <button title="Alterar senha" onClick={() => openPassword(u)} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", padding: 4 }}><Key size={14} /></button>
                          {delConfirm === u.id ? (
                            <>
                              <button onClick={() => deleteUser(u.id)} style={{ background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Sim</button>
                              <button onClick={() => setDelConfirm(null)} style={{ background: "var(--bg3)", border: "none", color: "var(--text)", cursor: "pointer", borderRadius: 4, padding: "2px 8px", fontSize: 11 }}>Não</button>
                            </>
                          ) : (
                            <button title="Remover" onClick={() => setDelConfirm(u.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }}><Trash2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {modal === "create" && "Novo Usuário"}
                {modal === "edit" && `Editar: ${editing?.name}`}
                {modal === "password" && `Alterar Senha: ${editing?.name}`}
              </h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#ef4444", marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Create / Edit fields */}
              {(modal === "create" || modal === "edit") && (
                <>
                  {modal === "create" && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Nome de usuário (login) *</label>
                      <input className="input-field" placeholder="joao.silva" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, ".") }))} />
                      <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>Será usado para entrar no sistema. Sem espaços.</div>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Nome completo *</label>
                    <input className="input-field" placeholder="João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Perfil de acesso *</label>
                    <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                      <option value="admin">Administrador — acesso total</option>
                      <option value="editor">Editor — pode editar o inventário</option>
                      <option value="viewer">Visualizador — somente leitura</option>
                    </select>
                  </div>
                  {modal === "edit" && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Status</label>
                      <div style={{ display: "flex", gap: 12 }}>
                        {[true, false].map(val => (
                          <label key={String(val)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                            <input type="radio" checked={form.active === val} onChange={() => setForm(f => ({ ...f, active: val }))} style={{ accentColor: "var(--accent)" }} />
                            <span style={{ color: val ? "#10b981" : "#6b7280" }}>{val ? "Ativo" : "Inativo"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Password fields */}
              {(modal === "create" || modal === "password") && (
                <>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>
                      {modal === "create" ? "Senha *" : "Nova senha *"}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input className="input-field" style={{ paddingRight: 38 }} type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}>
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>Mínimo 6 caracteres.</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 }}>Confirmar senha *</label>
                    <input className="input-field" type={showPass ? "text" : "password"} placeholder="••••••••" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
                    {form.confirm && form.password !== form.confirm && (
                      <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3 }}>As senhas não coincidem</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button className="btn-secondary" onClick={closeModal}>Cancelar</button>
              <button className="btn-primary" disabled={saving} onClick={
                modal === "create" ? saveCreate : modal === "edit" ? saveEdit : savePassword
              }>
                <ShieldCheck size={14} />
                {saving ? "Salvando..." : modal === "create" ? "Criar Usuário" : modal === "password" ? "Alterar Senha" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
