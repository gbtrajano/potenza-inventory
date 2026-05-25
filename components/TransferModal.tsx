"use client";
import { useState, useEffect } from "react";
import { ArrowRightLeft, Search, X, Check } from "lucide-react";
import { InventoryItem } from "@/lib/db";
import { LOJAS, DEPARTAMENTOS } from "@/lib/constants";

export default function TransferModal({ item, onDone, onClose, standalone }: {
  item?: InventoryItem | null;
  onDone: () => void;
  onClose?: () => void;
  standalone?: boolean;
}) {
  const [step, setStep] = useState<"select" | "form" | "done">("select");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(item || null);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    novo_usuario: "", novo_cargo: "", nova_loja: "", novo_departamento: "", nova_localizacao: "", motivo: ""
  });

  useEffect(() => {
    if (item) { setSelectedItem(item); setStep("form"); }
  }, [item]);

  useEffect(() => {
    if (step === "select" && search.length > 1) {
      setLoading(true);
      fetch(`/api/inventory?search=${encodeURIComponent(search)}`).then(r => r.json()).then(d => {
        setItems(d.items.slice(0, 10));
        setLoading(false);
      });
    }
  }, [search, step]);

  useEffect(() => {
    if (selectedItem) {
      setForm({
        novo_usuario: selectedItem.usuario || "",
        novo_cargo: selectedItem.cargo || "",
        nova_loja: selectedItem.loja || "",
        novo_departamento: selectedItem.departamento || "",
        nova_localizacao: selectedItem.localizacao || "",
        motivo: "",
      });
    }
  }, [selectedItem]);

  async function doTransfer() {
    if (!selectedItem) return;
    setSaving(true);
    await fetch("/api/inventory/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: selectedItem.id, ...form, usuario_operacao: "Usuário" }),
    });
    setSaving(false);
    setStep("done");
    setTimeout(() => { onDone(); setStep("select"); setSelectedItem(null); }, 1500);
  }

  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRightLeft size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Transferência Rápida</h2>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>Mova equipamentos entre usuários ou locais</div>
        </div>
        {onClose && !standalone && <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><X size={18} /></button>}
      </div>

      {step === "done" && (
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Check size={28} color="#10b981" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#10b981" }}>Transferência realizada!</div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>O histórico foi registrado.</div>
        </div>
      )}

      {step === "select" && (
        <>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text2)" }} />
            <input className="input-field" style={{ paddingLeft: 32 }} placeholder="Buscar por patrimônio, usuário, modelo..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          {loading && <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 12 }}>Buscando...</div>}
          {items.map(i => (
            <div key={i.id} onClick={() => { setSelectedItem(i); setStep("form"); }} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, color: "var(--accent)" }}>{i.patrimonio || "Sem patrimônio"}</div>
                <span style={{ fontSize: 11, background: "rgba(245,158,11,0.15)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4 }}>{i.tipo}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                {i.usuario || "Sem usuário"} · {i.loja} · {i.modelo}
              </div>
            </div>
          ))}
          {search.length > 1 && !loading && items.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 12, padding: 16 }}>Nenhum item encontrado</div>
          )}
          {search.length <= 1 && <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 12, padding: 16 }}>Digite pelo menos 2 caracteres para buscar</div>}
        </>
      )}

      {step === "form" && selectedItem && (
        <>
          {/* Current item info */}
          <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Equipamento Selecionado</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div><span style={{ color: "var(--accent)", fontWeight: 700 }}>{selectedItem.patrimonio || "Sem patrimônio"}</span></div>
              <div style={{ color: "var(--text2)", fontSize: 12 }}>{selectedItem.tipo}</div>
              <div style={{ color: "var(--text2)", fontSize: 12 }}>{selectedItem.modelo}</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              Atual: <strong style={{ color: "var(--text)" }}>{selectedItem.usuario || "Sem usuário"}</strong> · {selectedItem.loja} · {selectedItem.departamento}
            </div>
          </div>

          {!standalone && <button className="btn-secondary" style={{ fontSize: 11, padding: "5px 10px", width: "fit-content" }} onClick={() => setStep("select")}>← Buscar outro</button>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { field: "novo_usuario", label: "Novo Usuário", placeholder: "Nome do funcionário" },
              { field: "novo_cargo", label: "Novo Cargo", placeholder: "Cargo do funcionário" },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                <input className="input-field" placeholder={placeholder} value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Nova Loja</div>
              <select className="input-field" value={form.nova_loja} onChange={e => setForm(f => ({ ...f, nova_loja: e.target.value }))}>
                <option value="">Manter atual</option>
                {LOJAS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Novo Departamento</div>
              <select className="input-field" value={form.novo_departamento} onChange={e => setForm(f => ({ ...f, novo_departamento: e.target.value }))}>
                <option value="">Manter atual</option>
                {DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Nova Localização</div>
              <input className="input-field" placeholder="Ex: Sala da Administração" value={form.nova_localizacao} onChange={e => setForm(f => ({ ...f, nova_localizacao: e.target.value }))} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Motivo / Observação</div>
              <textarea className="input-field" style={{ minHeight: 60, resize: "vertical" }} placeholder="Ex: Máquina de Fulano apresentou defeito, transferindo POTENZA-XXXX do Ciclano..." value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {onClose && !standalone && <button className="btn-secondary" onClick={onClose}>Cancelar</button>}
            <button className="btn-primary" onClick={doTransfer} disabled={saving}>
              <ArrowRightLeft size={14} /> {saving ? "Transferindo..." : "Confirmar Transferência"}
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (standalone) return <div style={{ maxWidth: 680, margin: "0 auto" }}><div className="card">{content}</div></div>;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-box">{content}</div>
    </div>
  );
}
