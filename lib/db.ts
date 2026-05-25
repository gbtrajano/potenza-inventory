import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'inventory.db');
const SCHEMA_VERSION = 1;

// We use a JSON-based local database since better-sqlite3 can't build in this env
// Structure: { items: InventoryItem[], history: HistoryEntry[], schema_version: number }

export interface InventoryItem {
  id: string;
  loja: string;
  tipo: string;
  departamento: string;
  localizacao: string;
  modelo: string;
  numero_serie: string;
  ip: string;
  usuario: string;
  pin: string;
  cargo: string;
  ramal: string;
  patrimonio_antigo: string;
  patrimonio: string;
  patrimonio_vinculado: string;
  observacao: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryEntry {
  id: string;
  item_id: string;
  action: 'create' | 'update' | 'delete' | 'transfer';
  changes: Record<string, { from: string; to: string }>;
  usuario_operacao: string;
  timestamp: string;
  observacao?: string;
}

export interface Database {
  items: InventoryItem[];
  history: HistoryEntry[];
  schema_version: number;
}

function ensureDataDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readDB(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const initial: Database = { items: [], history: [], schema_version: SCHEMA_VERSION };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as Database;
  } catch {
    const initial: Database = { items: [], history: [], schema_version: SCHEMA_VERSION };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

export function writeDB(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function now(): string {
  return new Date().toISOString();
}
