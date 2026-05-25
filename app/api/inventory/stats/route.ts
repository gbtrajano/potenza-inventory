import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET() {
  const db = readDB();
  const items = db.items;

  const totalItems = items.length;

  // By tipo
  const byTipo: Record<string, number> = {};
  items.forEach(i => { byTipo[i.tipo] = (byTipo[i.tipo] || 0) + 1; });

  // By loja
  const byLoja: Record<string, number> = {};
  items.forEach(i => { byLoja[i.loja] = (byLoja[i.loja] || 0) + 1; });

  // By departamento
  const byDepartamento: Record<string, number> = {};
  items.forEach(i => { byDepartamento[i.departamento] = (byDepartamento[i.departamento] || 0) + 1; });

  // Items with no user
  const semUsuario = items.filter(i => ['NOTEBOOK', 'DESKTOP', 'TABLET'].includes(i.tipo) && !i.usuario).length;

  // Items with no patrimonio
  const semPatrimonio = items.filter(i => !i.patrimonio).length;

  // Recent history (last 20)
  const recentHistory = [...db.history]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20);

  // Items added last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentItems = items.filter(i => i.created_at >= thirtyDaysAgo).length;

  return NextResponse.json({
    totalItems,
    byTipo,
    byLoja,
    byDepartamento,
    semUsuario,
    semPatrimonio,
    recentItems,
    recentHistory,
    totalHistory: db.history.length,
  });
}
