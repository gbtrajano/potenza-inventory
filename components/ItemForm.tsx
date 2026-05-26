"use client";
import { useState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { InventoryItem } from "@/lib/db";

// Fields shown per tipo
const TIPO_FIELD_CONFIG: Record<string, {
  show: string[];
  required?: string[];
}> = {
  IMPRESSORA: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","pin","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo","modelo"] },
  NOTEBOOK: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","usuario","cargo","patrimonio_antigo","patrimonio","patrimonio_vinculado","observacao"], required: ["loja","tipo","modelo"] },
  DESKTOP: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","usuario","cargo","patrimonio_antigo","patrimonio","patrimonio_vinculado","observacao"], required: ["loja","tipo","modelo"] },
  MONITOR: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","usuario","cargo","patrimonio_antigo","patrimonio","patrimonio_vinculado","observacao"], required: ["loja","tipo","modelo"] },
  TELEFONE: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ramal","usuario","cargo","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  SWITCH: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  ROTEADOR: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  MIKROTIK: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  NOBREAK: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  ESTABILIZADOR: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  DVR: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  TELEVISÃO: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  TABLET: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","usuario","cargo","patrimonio_antigo","patrimonio","observacao"], required: ["loja","tipo"] },
  DEFAULT: { show: ["loja","tipo","departamento","localizacao","modelo","numero_serie","ip","usuario","cargo","ramal","pin","patrimonio_antigo","patrimonio","patrimonio_vinculado","observacao"], required: ["loja","tipo"] },
};

const FIELD_LABELS: Record<string, string> = {
  loja: "Loja", tipo: "Tipo de Equipamento", departamento: "Departamento",
  localizacao: "Localização (Sala)", modelo: "Modelo", numero_serie: "Número de Série",
  ip: "Endereço IP", usuario: "Usuário (Funcionário)", pin: "PIN da Impressora",
  cargo: "Cargo", ramal: "Ramal", patrimonio_antigo: "Patrimônio Antigo",
  patrimonio: "Patrimônio (Atual)", patrimonio_vinculado: "Patrimônio Vinculado",
  observacao: "Observação",
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  loja: "Selecione a loja", tipo: "Selecione o tipo",
  departamento: "Selecione o departamento",
  localizacao: "Ex: Sala da Administração, Showroom...",
  modelo: "Ex: HP LaserJet Pro 4103FDW",
  numero_serie: "Ex: BRM5H03T", ip: "Ex: 192.168.1.40",
  usuario: "Nome completo do funcionário",
  pin: "Ex: 70776712", cargo: "Ex: Consultor de Vendas",
  ramal: "Ex: 1234", patrimonio_antigo: "Ex: GENIAL-000524",
  patrimonio: "Ex: POTENZA-2209", patrimonio_vinculado: "Ex: POTENZA-0090",
  observacao: "Observações sobre o equipamento...",
};

type FormData = Omit<InventoryItem, "id" | "created_at" | "updated_at">;

const EMPTY: FormData = {
  loja: "", tipo: "", departamento: "", localizacao: "", modelo: "",
  numero_serie: "", ip: "", usuario: "", pin: "", cargo: "", ramal: "",
  patrimonio_antigo: "", patrimonio: "", patrimonio_vinculado: "", observacao: "",
};

export default function ItemForm({ item, onDone, onCancel }: {
  item?: InventoryItem | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>(item ? { ...item } : { ...EMPTY });
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metaLojas, setMetaLojas] = useState<string[]>([]);
  const [metaTipos, setMetaTipos] = useState<string[]>([]);
  const [metaDeps, setMetaDeps] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/inventory?meta=true")
      .then(r => r.json())
      .then(d => {
        setMetaLojas(d.lojas || []);
        setMetaTipos(d.tipos || []);
        setMetaDeps(d.departamentos || []);
      });
  }, []);

  const config = TIPO_FIELD_CONFIG[form.tipo] || TIPO_FIELD_CONFIG.DEFAULT;
  const showFields = form.tipo ? config.show : ["loja", "tipo"];

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const ne = { ...e }; delete ne[field]; return ne; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    (config.required || ["loja", "tipo"]).forEach(f => {
      if (!form[f as keyof FormData]) errs[f] = "Obrigatório";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    const method = item ? "PUT" : "POST";
    const body = item ? { ...form, id: item.id } : form;
    await fetch("/api/inventory", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    onDone();
  }

  function renderField(field: string) {
    const label = FIELD_LABELS[field] || field;
    const placeholder = FIELD_PLACEHOLDERS[field] || "";
    const value = form[field as keyof FormData] || "";
    const err = errors[field];

    if (field === "loja") return (
      <div key={field}>
        <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label} *</label>
        <select className="input-field" style={{ marginTop: 4, borderColor: err ? "#ef4444" : "" }} value={value} onChange={e => set(field, e.target.value)}>
          <option value="">Selecione...</option>
          {metaLojas.map(l => <option key={l}>{l}</option>)}
        </select>
        {err && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{err}</div>}
      </div>
    );

    if (field === "tipo") return (
      <div key={field}>
        <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label} *</label>
        <select className="input-field" style={{ marginTop: 4, borderColor: err ? "#ef4444" : "" }} value={value} onChange={e => set(field, e.target.value)}>
          <option value="">Selecione...</option>
          {metaTipos.map(t => <option key={t}>{t}</option>)}
        </select>
        {err && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{err}</div>}
      </div>
    );

    if (field === "departamento") return (
      <div key={field}>
        <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
        <select className="input-field" style={{ marginTop: 4 }} value={value} onChange={e => set(field, e.target.value)}>
          <option value="">Selecione...</option>
          {metaDeps.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
    );

    if (field === "observacao") return (
      <div key={field} style={{ gridColumn: "1 / -1" }}>
        <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
        <textarea className="input-field" style={{ marginTop: 4, minHeight: 70, resize: "vertical" }} placeholder={placeholder} value={value} onChange={e => set(field, e.target.value)} />
      </div>
    );

    return (
      <div key={field}>
        <label style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
        <input className="input-field" style={{ marginTop: 4, borderColor: err ? "#ef4444" : "" }} placeholder={placeholder} value={value} onChange={e => set(field, e.target.value)} />
        {err && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{err}</div>}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{item ? "Editar Item" : "Novo Equipamento"}</h2>
            {form.tipo && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Tipo: <span style={{ color: "var(--accent)" }}>{form.tipo}</span></div>}
          </div>
          <button className="btn-secondary" onClick={onCancel}><X size={14} /> Cancelar</button>
        </div>

        {/* Tipo hint */}
        {!form.tipo && (
          <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--text2)" }}>
            💡 Selecione o <strong style={{ color: "var(--accent)" }}>Tipo de Equipamento</strong> para ver os campos específicos do formulário
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {showFields.map(f => renderField(f))}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            <Save size={14} /> {loading ? "Salvando..." : item ? "Salvar Alterações" : "Cadastrar Equipamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
