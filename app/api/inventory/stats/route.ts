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
  const semPatrimonio = items.filter(i => !i.patrimonio || i.patrimonio === '-').length;

  // Regularizados (Items with user and patrimonio)
  const regularizados = items.filter(i => 
    (!['NOTEBOOK', 'DESKTOP', 'TABLET'].includes(i.tipo) || (i.usuario && i.usuario !== '-')) && 
    (i.patrimonio && i.patrimonio !== '-')
  ).length;

  // Critical Alerts
  const alerts: { message: string; severity: 'critical' | 'warning' | 'info' }[] = [];
  
  // Find store with most pending patrimonios
  const byLojaPendencias: Record<string, number> = {};
  items.filter(i => !i.patrimonio || i.patrimonio === '-').forEach(i => {
    byLojaPendencias[i.loja] = (byLojaPendencias[i.loja] || 0) + 1;
  });
  const worstLoja = Object.entries(byLojaPendencias).sort((a, b) => b[1] - a[1])[0];
  
  if (worstLoja && worstLoja[1] > 5) {
    alerts.push({ message: `${worstLoja[0]} possui a maior divergência (${worstLoja[1]} itens sem patrimônio)`, severity: 'critical' });
  }
  
  if (semUsuario > 0) {
    alerts.push({ message: `${semUsuario} equipamentos ociosos (sem usuário atribuído)`, severity: 'warning' });
  }

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
    regularizados,
    alerts,
    recentItems,
    recentHistory,
    totalHistory: db.history.length,
  });
}
