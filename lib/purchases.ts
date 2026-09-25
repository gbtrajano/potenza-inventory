import fs from 'fs';
import path from 'path';

const PURCHASES_PATH = path.join(process.cwd(), 'data', 'purchases.db');

export type PeripheralType = 'keyboard' | 'mouse';

export interface Shipment {
  id: string;
  type: PeripheralType;
  brand_model: string;
  quantity: number;
  received_at: string;
  supplier: string;
  invoice: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface Replacement {
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
  created_at: string;
}

export interface PurchasesDB {
  shipments: Shipment[];
  replacements: Replacement[];
  schema_version: number;
}

function initialDB(): PurchasesDB {
  return { shipments: [], replacements: [], schema_version: 1 };
}

function ensureDataDir() {
  const dir = path.dirname(PURCHASES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readPurchases(): PurchasesDB {
  ensureDataDir();
  if (!fs.existsSync(PURCHASES_PATH)) {
    const db = initialDB();
    fs.writeFileSync(PURCHASES_PATH, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(PURCHASES_PATH, 'utf-8')) as Partial<PurchasesDB>;
    return {
      shipments: Array.isArray(parsed.shipments) ? parsed.shipments : [],
      replacements: Array.isArray(parsed.replacements) ? parsed.replacements : [],
      schema_version: parsed.schema_version || 1,
    };
  } catch {
    return initialDB();
  }
}

export function writePurchases(db: PurchasesDB) {
  ensureDataDir();
  const temporaryPath = `${PURCHASES_PATH}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(temporaryPath, PURCHASES_PATH);
}

export function purchaseId(prefix: 'shipment' | 'replacement') {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function shipmentUsed(db: PurchasesDB, shipmentId: string) {
  return db.replacements
    .filter(replacement => replacement.shipment_id === shipmentId)
    .reduce((total, replacement) => total + replacement.quantity, 0);
}
