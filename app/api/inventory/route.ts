import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, now, InventoryItem } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const db = readDB();

  // Return distinct filter values from actual data
  if (searchParams.get('meta') === 'true') {
    const unique = <T>(arr: T[]) => Array.from(new Set(arr)).filter(Boolean).sort() as T[];
    return NextResponse.json({
      lojas: unique(db.items.map(i => i.loja)),
      tipos: unique(db.items.map(i => i.tipo)),
      departamentos: unique(db.items.map(i => i.departamento)),
    });
  }

  let items = db.items;

  const loja = searchParams.get('loja');
  const tipo = searchParams.get('tipo');
  const departamento = searchParams.get('departamento');
  const search = searchParams.get('search');

  if (loja) items = items.filter(i => i.loja === loja);
  if (tipo) items = items.filter(i => i.tipo === tipo);
  if (departamento) items = items.filter(i => i.departamento === departamento);
  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i =>
      Object.values(i).some(v => v && String(v).toLowerCase().includes(s))
    );
  }

  return NextResponse.json({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = readDB();

  const item: InventoryItem = {
    id: generateId(),
    loja: body.loja || '',
    tipo: body.tipo || '',
    departamento: body.departamento || '',
    localizacao: body.localizacao || '',
    modelo: body.modelo || '',
    numero_serie: body.numero_serie || '',
    ip: body.ip || '',
    usuario: body.usuario || '',
    pin: body.pin || '',
    cargo: body.cargo || '',
    ramal: body.ramal || '',
    patrimonio_antigo: body.patrimonio_antigo || '',
    patrimonio: body.patrimonio || '',
    patrimonio_vinculado: body.patrimonio_vinculado || '',
    observacao: body.observacao || '',
    created_at: now(),
    updated_at: now(),
  };

  db.items.push(item);
  db.history.push({
    id: generateId(),
    item_id: item.id,
    action: 'create',
    changes: {},
    usuario_operacao: body.usuario_operacao || 'Sistema',
    timestamp: now(),
    observacao: `Cadastro inicial: ${item.tipo} - ${item.patrimonio || item.modelo}`,
  });

  writeDB(db);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = readDB();
  const idx = db.items.findIndex(i => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const old = db.items[idx];
  const changes: Record<string, { from: string; to: string }> = {};
  const fields: (keyof InventoryItem)[] = [
    'loja','tipo','departamento','localizacao','modelo','numero_serie',
    'ip','usuario','pin','cargo','ramal','patrimonio_antigo','patrimonio',
    'patrimonio_vinculado','observacao'
  ];
  fields.forEach(f => {
    if (body[f] !== undefined && body[f] !== old[f]) {
      changes[f] = { from: old[f] as string, to: body[f] };
    }
  });

  const updated = { ...old, ...body, updated_at: now() };
  db.items[idx] = updated;
  db.history.push({
    id: generateId(),
    item_id: body.id,
    action: 'update',
    changes,
    usuario_operacao: body.usuario_operacao || 'Sistema',
    timestamp: now(),
  });

  writeDB(db);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = readDB();
  const idx = db.items.findIndex(i => i.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const item = db.items[idx];
  db.items.splice(idx, 1);
  db.history.push({
    id: generateId(),
    item_id: id,
    action: 'delete',
    changes: {},
    usuario_operacao: 'Sistema',
    timestamp: now(),
    observacao: `Removido: ${item.tipo} - ${item.patrimonio || item.modelo}`,
  });

  writeDB(db);
  return NextResponse.json({ success: true });
}
