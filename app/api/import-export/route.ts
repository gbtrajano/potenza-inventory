import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, now, InventoryItem } from '@/lib/db';
import { CSV_COLUMN_MAP } from '@/lib/constants';

// GET: export as CSV or JSON
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const db = readDB();

  if (format === 'json') {
    return new NextResponse(JSON.stringify(db.items, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="inventario_potenza.json"',
      },
    });
  }

  // CSV export
  const headers = [
    'LOJA','TIPO','DEPARTAMENTO','LOCALIZAÇÃO','MODELO','Nº DE SÉRIE',
    'IP','USUÁRIO','PIN','CARGO','RAMAL','PATRIMÔNIO ANTIGO','PATRIMÔNIO',
    'PATRIMÔNIO VINCULADO','OBS.'
  ];
  const rows = db.items.map(i => [
    i.loja, i.tipo, i.departamento, i.localizacao, i.modelo, i.numero_serie,
    i.ip, i.usuario, i.pin, i.cargo, i.ramal, i.patrimonio_antigo, i.patrimonio,
    i.patrimonio_vinculado, i.observacao
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inventario_potenza.csv"',
    },
  });
}

// POST: import CSV data (sent as JSON array of objects)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rows, mode } = body; // mode: 'append' | 'replace'

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows must be array' }, { status: 400 });
  }

  const db = readDB();
  
  if (mode === 'replace') {
    db.items = [];
  }

  const imported: InventoryItem[] = [];
  const errors: string[] = [];

  rows.forEach((row: Record<string, string>, idx: number) => {
    try {
      const mapped: Partial<InventoryItem> = {};
      Object.entries(row).forEach(([key, val]) => {
        const normalizedKey = key.trim().toUpperCase();
        const field = CSV_COLUMN_MAP[normalizedKey] || CSV_COLUMN_MAP[key.trim()];
        if (field) {
          (mapped as Record<string, string>)[field] = String(val || '').trim();
        }
      });

      const item: InventoryItem = {
        id: generateId(),
        loja: mapped.loja || '',
        tipo: mapped.tipo || '',
        departamento: mapped.departamento || '',
        localizacao: mapped.localizacao || '',
        modelo: mapped.modelo || '',
        numero_serie: mapped.numero_serie || '',
        ip: mapped.ip || '',
        usuario: mapped.usuario || '',
        pin: mapped.pin || '',
        cargo: mapped.cargo || '',
        ramal: mapped.ramal || '',
        patrimonio_antigo: mapped.patrimonio_antigo || '',
        patrimonio: mapped.patrimonio || '',
        patrimonio_vinculado: mapped.patrimonio_vinculado || '',
        observacao: mapped.observacao || '',
        created_at: now(),
        updated_at: now(),
      };

      db.items.push(item);
      imported.push(item);
    } catch (e) {
      errors.push(`Row ${idx + 1}: ${e}`);
    }
  });

  db.history.push({
    id: generateId(),
    item_id: 'bulk',
    action: 'create',
    changes: {},
    usuario_operacao: 'Importação CSV',
    timestamp: now(),
    observacao: `Importados ${imported.length} itens via CSV (modo: ${mode})`,
  });

  writeDB(db);
  return NextResponse.json({ imported: imported.length, errors, total: db.items.length });
}
