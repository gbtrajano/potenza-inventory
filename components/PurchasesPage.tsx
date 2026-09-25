"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive, Boxes, Check, Eye, Keyboard, Mouse, PackagePlus,
  RefreshCw, Search, ShoppingCart, UserRoundCheck, X,
} from "lucide-react";

type PeripheralType = "keyboard" | "mouse";

interface Shipment {
  id: string;
  type: PeripheralType;
  brand_model: string;
  quantity: number;
  received_at: string;
  supplier: string;
  invoice: string;
  notes: string;
  created_by: string;
  used: number;
  available: number;
}

interface Replacement {
  id: string;
  shipment_id: string;
  type: PeripheralType;
  brand_model: string;
  serial_number: string;
  recipient: string;
  department: string;
  location: string;
  quantity: number;
  replaced_at: string;
  reason: string;
  notes: string;
  created_by: string;
}

interface PurchasesData {
  shipments: Shipment[];
  replacements: Replacement[];
  totals: Record<PeripheralType, { received: number; used: number; available: number }>;
  canEdit: boolean;
}

type Modal = "shipment" | "replacement" | null;
type Tab = "replacements" | "shipments";

const emptyTotals = {
  keyboard: { received: 0, used: 0, available: 0 },
  mouse: { received: 0, used: 0, available: 0 },
};

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function displayDate(value: string, withTime = false) {
  if (!value) return "—";
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return withTime
    ? date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : date.toLocaleDateString("pt-BR");
}

const typeInfo = {
  keyboard: { label: "Teclado", color: "#3b82f6", icon: Keyboard },
  mouse: { label: "Mouse", color: "#a78bfa", icon: Mouse },
};

export default function PurchasesPage() {
  const [data, setData] = useState<PurchasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [tab, setTab] = useState<Tab>("replacements");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shipmentForm, setShipmentForm] = useState({
    type: "keyboard" as PeripheralType, brand_model: "", quantity: 10,
    received_at: new Date().toISOString().slice(0, 10), supplier: "", invoice: "", notes: "",
  });
  const [replacementForm, setReplacementForm] = useState({
    shipment_id: "", quantity: 1, recipient: "", department: "", location: "",
    serial_number: "", replaced_at: localDateTimeValue(), reason: "Defeito", notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/purchases", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível carregar os dados.");
      setData(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const availableShipments = useMemo(
    () => (data?.shipments || []).filter(shipment => shipment.available > 0),
    [data],
  );

  const normalizedSearch = search.toLocaleLowerCase("pt-BR").trim();
  const filteredReplacements = (data?.replacements || []).filter(item =>
    !normalizedSearch || [item.recipient, item.department, item.location, item.brand_model, item.serial_number, item.reason]
      .some(value => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch)),
  );
  const filteredShipments = (data?.shipments || []).filter(item =>
    !normalizedSearch || [item.brand_model, item.supplier, item.invoice, item.notes]
      .some(value => value.toLocaleLowerCase("pt-BR").includes(normalizedSearch)),
  );

  function openReplacement() {
    const first = availableShipments[0];
    setReplacementForm({
      shipment_id: first?.id || "", quantity: 1, recipient: "", department: "", location: "",
      serial_number: "", replaced_at: localDateTimeValue(), reason: "Defeito", notes: "",
    });
    setError("");
    setModal("replacement");
  }

  function openShipment() {
    setShipmentForm({
      type: "keyboard", brand_model: "", quantity: 10,
      received_at: new Date().toISOString().slice(0, 10), supplier: "", invoice: "", notes: "",
    });
    setError("");
    setModal("shipment");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = modal === "shipment"
      ? { action: "create_shipment", ...shipmentForm }
      : { action: "create_replacement", ...replacementForm };
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível salvar.");
      setSuccess(modal === "shipment" ? "Remessa adicionada e saldo atualizado." : "Troca registrada e saldo atualizado.");
      setModal(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const totals = data?.totals || emptyTotals;
  const allReceived = totals.keyboard.received + totals.mouse.received;
  const allUsed = totals.keyboard.used + totals.mouse.used;
  const allAvailable = totals.keyboard.available + totals.mouse.available;

  if (loading && !data) return <div className="purchase-loading">Carregando controle de periféricos...</div>;

  return (
    <div className="purchases-page">
      <section className="purchases-hero">
        <div>
          <div className="purchases-eyebrow"><ShoppingCart size={14} /> CONTROLE DE COMPRAS</div>
          <h1>Teclados e mouses</h1>
          <p>Remessas recebidas, saldo disponível e histórico de todas as trocas.</p>
        </div>
        <div className="purchases-actions">
          <button className="btn-secondary" onClick={load} title="Atualizar"><RefreshCw size={15} /></button>
          {data?.canEdit ? (
            <>
              <button className="btn-secondary" onClick={openShipment}><PackagePlus size={15} /> Nova remessa</button>
              <button className="btn-primary" onClick={openReplacement} disabled={!availableShipments.length}>
                <UserRoundCheck size={15} /> Registrar troca
              </button>
            </>
          ) : (
            <span className="readonly-badge"><Eye size={14} /> Acesso somente para consulta</span>
          )}
        </div>
      </section>

      {success && (
        <div className="purchase-feedback success"><Check size={15} /> {success}<button onClick={() => setSuccess("")}><X size={14} /></button></div>
      )}
      {error && !modal && <div className="purchase-feedback error">{error}<button onClick={() => setError("")}><X size={14} /></button></div>}

      <section className="purchase-stats">
        <div className="purchase-stat featured">
          <span>Saldo total</span><strong>{allAvailable}</strong><small>{allReceived} recebidos · {allUsed} utilizados</small>
        </div>
        {(["keyboard", "mouse"] as PeripheralType[]).map(type => {
          const info = typeInfo[type];
          const Icon = info.icon;
          return (
            <div className="purchase-stat" key={type}>
              <div className="purchase-stat-icon" style={{ color: info.color, background: `${info.color}18` }}><Icon size={20} /></div>
              <div><span>{info.label}s disponíveis</span><strong>{totals[type].available}</strong><small>{totals[type].used} trocados de {totals[type].received}</small></div>
            </div>
          );
        })}
        <div className="purchase-stat">
          <div className="purchase-stat-icon" style={{ color: "#10b981", background: "rgba(16,185,129,.1)" }}><Archive size={20} /></div>
          <div><span>Trocas registradas</span><strong>{data?.replacements.length || 0}</strong><small>histórico rastreável</small></div>
        </div>
      </section>

      <section className="card purchases-table-card">
        <div className="purchases-table-toolbar">
          <div className="purchase-tabs">
            <button className={tab === "replacements" ? "active" : ""} onClick={() => setTab("replacements")}>Histórico de trocas</button>
            <button className={tab === "shipments" ? "active" : ""} onClick={() => setTab("shipments")}>Remessas e saldo</button>
          </div>
          <label className="purchase-search"><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar pessoa, modelo, setor..." /></label>
        </div>

        <div className="purchase-table-wrap">
          {tab === "replacements" ? (
            filteredReplacements.length ? <table>
              <thead><tr><th>DATA / HORA</th><th>PERIFÉRICO</th><th>ENTREGUE PARA</th><th>SETOR / LOCAL</th><th>QTD.</th><th>MOTIVO</th><th>REGISTRADO POR</th></tr></thead>
              <tbody>{filteredReplacements.map(item => {
                const info = typeInfo[item.type];
                const Icon = info.icon;
                return <tr key={item.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{displayDate(item.replaced_at, true)}</td>
                  <td><div className="peripheral-cell"><span style={{ color: info.color }}><Icon size={15} /></span><div><b>{info.label} · {item.brand_model}</b>{item.serial_number && <small>S/N: {item.serial_number}</small>}</div></div></td>
                  <td><b>{item.recipient}</b>{item.notes && <small className="table-note">{item.notes}</small>}</td>
                  <td>{[item.department, item.location].filter(Boolean).join(" · ") || "—"}</td>
                  <td><span className="quantity-pill">{item.quantity}</span></td>
                  <td>{item.reason || "—"}</td><td>{item.created_by}</td>
                </tr>;
              })}</tbody>
            </table> : <EmptyState icon={<UserRoundCheck size={24} />} text="Nenhuma troca encontrada." />
          ) : (
            filteredShipments.length ? <table>
              <thead><tr><th>RECEBIMENTO</th><th>PERIFÉRICO / MODELO</th><th>FORNECEDOR</th><th>NF / PEDIDO</th><th>RECEBIDO</th><th>UTILIZADO</th><th>SALDO</th><th>ADICIONADO POR</th></tr></thead>
              <tbody>{filteredShipments.map(item => {
                const info = typeInfo[item.type];
                const Icon = info.icon;
                return <tr key={item.id}>
                  <td>{displayDate(item.received_at)}</td>
                  <td><div className="peripheral-cell"><span style={{ color: info.color }}><Icon size={15} /></span><div><b>{info.label} · {item.brand_model}</b>{item.notes && <small>{item.notes}</small>}</div></div></td>
                  <td>{item.supplier || "—"}</td><td>{item.invoice || "—"}</td><td>{item.quantity}</td><td>{item.used}</td>
                  <td><span className={`stock-pill ${item.available === 0 ? "empty" : ""}`}>{item.available}</span></td><td>{item.created_by}</td>
                </tr>;
              })}</tbody>
            </table> : <EmptyState icon={<Boxes size={24} />} text="Nenhuma remessa encontrada." />
          )}
        </div>
      </section>

      {modal && (
        <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && setModal(null)}>
          <form className="modal-box purchase-modal" onSubmit={submit}>
            <div className="purchase-modal-title"><div><h2>{modal === "shipment" ? "Adicionar remessa" : "Registrar troca"}</h2><p>{modal === "shipment" ? "Entrada de novos teclados ou mouses no estoque." : "Registre quem recebeu e desconte automaticamente do saldo."}</p></div><button type="button" onClick={() => setModal(null)}><X size={18} /></button></div>
            {error && <div className="purchase-feedback error">{error}</div>}

            {modal === "shipment" ? (
              <div className="purchase-form-grid">
                <Field label="Tipo *"><select className="input-field" value={shipmentForm.type} onChange={e => setShipmentForm(f => ({ ...f, type: e.target.value as PeripheralType }))}><option value="keyboard">Teclado</option><option value="mouse">Mouse</option></select></Field>
                <Field label="Quantidade *"><input className="input-field" type="number" min="1" required value={shipmentForm.quantity} onChange={e => setShipmentForm(f => ({ ...f, quantity: Number(e.target.value) }))} /></Field>
                <Field label="Marca / modelo *" wide><input className="input-field" required placeholder="Ex.: Logitech K120" value={shipmentForm.brand_model} onChange={e => setShipmentForm(f => ({ ...f, brand_model: e.target.value }))} /></Field>
                <Field label="Data de recebimento *"><input className="input-field" type="date" required value={shipmentForm.received_at} onChange={e => setShipmentForm(f => ({ ...f, received_at: e.target.value }))} /></Field>
                <Field label="Fornecedor"><input className="input-field" placeholder="Nome do fornecedor" value={shipmentForm.supplier} onChange={e => setShipmentForm(f => ({ ...f, supplier: e.target.value }))} /></Field>
                <Field label="NF ou pedido"><input className="input-field" placeholder="Número da nota/pedido" value={shipmentForm.invoice} onChange={e => setShipmentForm(f => ({ ...f, invoice: e.target.value }))} /></Field>
                <Field label="Observação" wide><textarea className="input-field" rows={3} value={shipmentForm.notes} onChange={e => setShipmentForm(f => ({ ...f, notes: e.target.value }))} /></Field>
              </div>
            ) : (
              <div className="purchase-form-grid">
                <Field label="Periférico / remessa *" wide><select className="input-field" required value={replacementForm.shipment_id} onChange={e => setReplacementForm(f => ({ ...f, shipment_id: e.target.value }))}><option value="">Selecione...</option>{availableShipments.map(item => <option key={item.id} value={item.id}>{typeInfo[item.type].label} · {item.brand_model} — saldo {item.available}</option>)}</select></Field>
                <Field label="Entregue para *" wide><input className="input-field" required placeholder="Nome do colaborador" value={replacementForm.recipient} onChange={e => setReplacementForm(f => ({ ...f, recipient: e.target.value }))} /></Field>
                <Field label="Data e hora *"><input className="input-field" required type="datetime-local" value={replacementForm.replaced_at} onChange={e => setReplacementForm(f => ({ ...f, replaced_at: e.target.value }))} /></Field>
                <Field label="Quantidade *"><input className="input-field" required type="number" min="1" value={replacementForm.quantity} onChange={e => setReplacementForm(f => ({ ...f, quantity: Number(e.target.value) }))} /></Field>
                <Field label="Setor"><input className="input-field" placeholder="Ex.: Financeiro" value={replacementForm.department} onChange={e => setReplacementForm(f => ({ ...f, department: e.target.value }))} /></Field>
                <Field label="Loja / local"><input className="input-field" placeholder="Ex.: Matriz" value={replacementForm.location} onChange={e => setReplacementForm(f => ({ ...f, location: e.target.value }))} /></Field>
                <Field label="Número de série"><input className="input-field" placeholder="Se houver" value={replacementForm.serial_number} onChange={e => setReplacementForm(f => ({ ...f, serial_number: e.target.value }))} /></Field>
                <Field label="Motivo"><select className="input-field" value={replacementForm.reason} onChange={e => setReplacementForm(f => ({ ...f, reason: e.target.value }))}><option>Defeito</option><option>Desgaste</option><option>Novo colaborador</option><option>Perda</option><option>Outro</option></select></Field>
                <Field label="Observação" wide><textarea className="input-field" rows={3} value={replacementForm.notes} onChange={e => setReplacementForm(f => ({ ...f, notes: e.target.value }))} /></Field>
              </div>
            )}

            <div className="purchase-modal-actions"><button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? "Salvando..." : modal === "shipment" ? "Adicionar remessa" : "Registrar troca"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "purchase-field wide" : "purchase-field"}><span>{label}</span>{children}</label>;
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="purchase-empty">{icon}<span>{text}</span></div>;
}
