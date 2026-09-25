import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  PeripheralType,
  purchaseId,
  readPurchases,
  Replacement,
  Shipment,
  shipmentUsed,
  writePurchases,
} from '@/lib/purchases';

const READ_ROLES = ['admin', 'editor', 'purchaser'];
const WRITE_ROLES = ['admin', 'editor'];

async function getIdentity() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    name: session.user.name || 'Sistema',
    role: String((session.user as { role?: string }).role || ''),
  };
}

function text(value: unknown, max = 200) {
  return String(value ?? '').trim().slice(0, max);
}

function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function peripheralType(value: unknown): PeripheralType | null {
  return value === 'keyboard' || value === 'mouse' ? value : null;
}

export async function GET() {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!READ_ROLES.includes(identity.role)) return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });

  const db = readPurchases();
  const shipments = [...db.shipments]
    .map(shipment => {
      const used = shipmentUsed(db, shipment.id);
      return { ...shipment, used, available: shipment.quantity - used };
    })
    .sort((a, b) => b.received_at.localeCompare(a.received_at));
  const replacements = [...db.replacements].sort((a, b) => b.replaced_at.localeCompare(a.replaced_at));

  const totals = shipments.reduce((acc, shipment) => {
    acc[shipment.type].received += shipment.quantity;
    acc[shipment.type].used += shipment.used;
    acc[shipment.type].available += shipment.available;
    return acc;
  }, {
    keyboard: { received: 0, used: 0, available: 0 },
    mouse: { received: 0, used: 0, available: 0 },
  });

  return NextResponse.json({ shipments, replacements, totals, canEdit: WRITE_ROLES.includes(identity.role) });
}

export async function POST(req: NextRequest) {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  if (!WRITE_ROLES.includes(identity.role)) return NextResponse.json({ error: 'Somente a equipe de TI pode alterar esta seção' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const db = readPurchases();

  if (body.action === 'create_shipment') {
    const type = peripheralType(body.type);
    const quantity = positiveInteger(body.quantity);
    const brandModel = text(body.brand_model, 120);
    const receivedAt = text(body.received_at, 30);
    if (!type || !quantity || !brandModel || !receivedAt) {
      return NextResponse.json({ error: 'Tipo, modelo, quantidade e data de recebimento são obrigatórios' }, { status: 400 });
    }

    const shipment: Shipment = {
      id: purchaseId('shipment'),
      type,
      brand_model: brandModel,
      quantity,
      received_at: receivedAt,
      supplier: text(body.supplier, 120),
      invoice: text(body.invoice, 80),
      notes: text(body.notes, 500),
      created_by: identity.name,
      created_at: new Date().toISOString(),
    };
    db.shipments.push(shipment);
    writePurchases(db);
    return NextResponse.json(shipment, { status: 201 });
  }

  if (body.action === 'create_replacement') {
    const shipmentId = text(body.shipment_id, 80);
    const shipment = db.shipments.find(item => item.id === shipmentId);
    const quantity = positiveInteger(body.quantity);
    const recipient = text(body.recipient, 120);
    const replacedAt = text(body.replaced_at, 30);
    if (!shipment || !quantity || !recipient || !replacedAt) {
      return NextResponse.json({ error: 'Remessa, quantidade, destinatário e data/hora são obrigatórios' }, { status: 400 });
    }

    const available = shipment.quantity - shipmentUsed(db, shipment.id);
    if (quantity > available) {
      return NextResponse.json({ error: `Saldo insuficiente. Disponível nesta remessa: ${available}` }, { status: 409 });
    }

    const replacement: Replacement = {
      id: purchaseId('replacement'),
      shipment_id: shipment.id,
      type: shipment.type,
      brand_model: shipment.brand_model,
      serial_number: text(body.serial_number, 100),
      recipient,
      department: text(body.department, 120),
      location: text(body.location, 120),
      quantity,
      replaced_at: replacedAt,
      reason: text(body.reason, 200),
      notes: text(body.notes, 500),
      created_by: identity.name,
      created_at: new Date().toISOString(),
    };
    db.replacements.push(replacement);
    writePurchases(db);
    return NextResponse.json(replacement, { status: 201 });
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
}
