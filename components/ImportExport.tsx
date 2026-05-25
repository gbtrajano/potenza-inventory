"use client";
import { useState, useRef } from "react";
import { Upload, Download, CheckCircle, AlertTriangle, X, FileSpreadsheet, FileText, Info } from "lucide-react";
import * as XLSX from "xlsx";

export default function ImportExport({ onDone }: { onDone: () => void }) {
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [preview, setPreview] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"csv" | "xlsx" | "">("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: string[]; total: number } | null>(null);
  const [parsedRows, setParsedRows] = useState<any[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    function parseLine(line: string): string[] {
      const res: string[] = [];
      let cur = "", inQ = false;
      for (const c of line) {
        if (c === '"') { inQ = !inQ; }
        else if (c === sep && !inQ) { res.push(cur.trim()); cur = ""; }
        else cur += c;
      }
      res.push(cur.trim());
      return res;
    }
    const headers = parseLine(lines[0]);
    return lines.slice(1).map(line => {
      const vals = parseLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || "").replace(/^"|"$/g, ""); });
      return obj;
    }).filter(row => Object.values(row).some(v => v));
  }

  function parseSheet(wb: XLSX.WorkBook, sheetName: string): any[] {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    // Use header:1 to get raw arrays, then map manually to handle merged/special headers
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "", raw: false });
    return rows.filter((row: any) => Object.values(row).some((v: any) => String(v).trim()));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setPreview(null);
    setParsedRows(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");

    const isXlsx = file.name.match(/\.xlsx?$/i);
    setFileType(isXlsx ? "xlsx" : "csv");

    const reader = new FileReader();

    if (isXlsx) {
      reader.onload = ev => {
        const data = ev.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        // Auto-select first sheet
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        const rows = parseSheet(wb, firstSheet);
        setParsedRows(rows);
        setPreview(rows.slice(0, 5));
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = ev => {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        setParsedRows(rows);
        setPreview(rows.slice(0, 5));
      };
      reader.readAsText(file, "utf-8");
    }
  }

  function handleSheetChange(sheet: string) {
    if (!workbook) return;
    setSelectedSheet(sheet);
    const rows = parseSheet(workbook, sheet);
    setParsedRows(rows);
    setPreview(rows.slice(0, 5));
  }

  async function doImport() {
    if (!parsedRows) return;
    setImporting(true);
    const res = await fetch("/api/import-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: parsedRows, mode }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
    setPreview(null);
    setParsedRows(null);
    setFileName("");
    setFileType("");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
    if (fileRef.current) fileRef.current.value = "";
    onDone();
  }

  function reset() {
    setPreview(null); setParsedRows(null); setFileName(""); setFileType("");
    setWorkbook(null); setSheetNames([]); setSelectedSheet("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function exportCSV() { window.open("/api/import-export?format=csv"); }
  function exportJSON() { window.open("/api/import-export?format=json"); }

  const previewCols = preview && preview[0] ? Object.keys(preview[0]).slice(0, 8) : [];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Export */}
      <div className="card">
        <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Exportar Inventário</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text2)" }}>Baixe todos os itens do inventário no formato desejado.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" onClick={exportCSV}><Download size={14} /> Exportar CSV</button>
          <button className="btn-secondary" onClick={exportJSON}><Download size={14} /> Exportar JSON</button>
        </div>
      </div>

      {/* Import */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Importar Planilha</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 11, background: "rgba(16,185,129,0.12)", color: "#34d399", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>CSV</span>
            <span style={{ fontSize: 11, background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>XLS</span>
            <span style={{ fontSize: 11, background: "rgba(59,130,246,0.12)", color: "#60a5fa", borderRadius: 4, padding: "2px 8px", fontWeight: 700 }}>XLSX</span>
          </div>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text2)" }}>
          Importe itens a partir da sua planilha Excel (.xlsx, .xls) ou CSV. As colunas são mapeadas automaticamente pelo nome do cabeçalho.
        </p>

        {/* Column mapping reference */}
        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text2)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <Info size={12} /> Cabeçalhos reconhecidos automaticamente
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["LOJA","TIPO","DEPARTAMENTO","LOCALIZAÇÃO","MODELO","Nº DE SÉRIE","IP","USUÁRIO","PIN","CARGO","RAMA","PATRIMÔNIO ANTIGO","PATRIMÔNIO","PATRIMÔNIO VINCULADO","OBS."].map(col => (
              <span key={col} style={{ background: "rgba(245,158,11,0.1)", color: "var(--accent)", borderRadius: 4, padding: "2px 8px" }}>{col}</span>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
          {(["append", "replace"] as const).map(m => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input type="radio" checked={mode === m} onChange={() => setMode(m)} style={{ accentColor: "var(--accent)" }} />
              <span style={{ color: mode === m ? "var(--text)" : "var(--text2)" }}>
                {m === "append" ? "✚ Adicionar ao inventário existente" : "⚠️ Substituir todo o inventário"}
              </span>
            </label>
          ))}
        </div>

        {mode === "replace" && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#ef4444" }}>
            ⚠️ <strong>Atenção:</strong> Esta opção apagará TODOS os itens do inventário antes de importar.
          </div>
        )}

        {/* Drop zone */}
        <div
          style={{
            border: `2px dashed ${fileName ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 10, padding: 32, textAlign: "center", cursor: "pointer",
            transition: "all 0.15s", background: fileName ? "rgba(245,158,11,0.04)" : "transparent"
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--accent)"; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = fileName ? "var(--accent)" : "var(--border)"; }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.style.borderColor = "var(--accent)";
            const file = e.dataTransfer.files[0];
            if (file) {
              const dt = new DataTransfer();
              dt.items.add(file);
              if (fileRef.current) {
                fileRef.current.files = dt.files;
                fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          }}
        >
          {fileName ? (
            <>
              {fileType === "xlsx"
                ? <FileSpreadsheet size={32} style={{ color: "#60a5fa", marginBottom: 8 }} />
                : <FileText size={32} style={{ color: "#34d399", marginBottom: 8 }} />
              }
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{fileName}</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
                {fileType === "xlsx" ? "Planilha Excel" : "Arquivo CSV"} · Clique para trocar
              </div>
            </>
          ) : (
            <>
              <Upload size={32} style={{ color: "var(--text2)", marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: "var(--text2)" }}>Arraste o arquivo aqui ou clique para selecionar</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 6, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <span style={{ background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>.xlsx</span>
                <span style={{ background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>.xls</span>
                <span style={{ background: "var(--bg3)", borderRadius: 4, padding: "2px 8px" }}>.csv</span>
              </div>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>

        {/* Sheet selector for XLSX with multiple sheets */}
        {fileType === "xlsx" && sheetNames.length > 1 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Planilha detectada com {sheetNames.length} abas — selecione qual importar:
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {sheetNames.map(name => (
                <button
                  key={name}
                  onClick={() => handleSheetChange(name)}
                  style={{
                    padding: "6px 14px", borderRadius: 6, border: "1px solid",
                    borderColor: selectedSheet === name ? "var(--accent)" : "var(--border)",
                    background: selectedSheet === name ? "rgba(245,158,11,0.12)" : "var(--bg3)",
                    color: selectedSheet === name ? "var(--accent)" : "var(--text2)",
                    cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                    transition: "all 0.15s"
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && parsedRows && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{parsedRows.length}</span> linhas detectadas
                {fileType === "xlsx" && selectedSheet && <span style={{ color: "var(--text2)" }}> · Aba: <strong style={{ color: "var(--accent)" }}>{selectedSheet}</strong></span>}
                <span style={{ color: "var(--text2)" }}> · Prévia (primeiras 5 linhas):</span>
              </div>
              <button onClick={reset} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
              <table>
                <thead>
                  <tr>{previewCols.map(k => <th key={k}>{k}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {previewCols.map((k, j) => (
                        <td key={j} style={{ fontSize: 11 }}>{String(row[k] ?? "") || <span style={{ color: "var(--text2)" }}>—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="btn-primary" onClick={doImport} disabled={importing}>
                <Upload size={14} />
                {importing ? "Importando..." : `Importar ${parsedRows.length} itens`}
              </button>
              <button className="btn-secondary" onClick={reset}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            marginTop: 16,
            background: result.errors.length ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)",
            border: `1px solid ${result.errors.length ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
            borderRadius: 8, padding: "16px 20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: result.errors.length ? 8 : 0 }}>
              {result.errors.length === 0
                ? <CheckCircle size={20} color="#10b981" />
                : <AlertTriangle size={20} color="#f59e0b" />
              }
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {result.imported} itens importados · Total no inventário: {result.total}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                {result.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
