import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const item_id = searchParams.get('item_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const db = readDB();
  let history = [...db.history].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (item_id) history = history.filter(h => h.item_id === item_id);

  const total = history.length;
  const page = history.slice(offset, offset + limit);

  // Enrich with item info
  const enriched = page.map(h => {
    const item = db.items.find(i => i.id === h.item_id);
    return {
      ...h,
      item_patrimonio: item?.patrimonio || '—',
      item_tipo: item?.tipo || '—',
      item_loja: item?.loja || '—',
    };
  });

  return NextResponse.json({ history: enriched, total });
}
