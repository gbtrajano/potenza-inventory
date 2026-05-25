import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, now } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { item_id, novo_usuario, novo_cargo, nova_loja, novo_departamento, nova_localizacao, motivo, usuario_operacao } = body;

  const db = readDB();
  const idx = db.items.findIndex(i => i.id === item_id);
  if (idx === -1) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const old = db.items[idx];
  const changes: Record<string, { from: string; to: string }> = {};

  if (novo_usuario !== undefined && novo_usuario !== old.usuario) changes.usuario = { from: old.usuario, to: novo_usuario };
  if (novo_cargo !== undefined && novo_cargo !== old.cargo) changes.cargo = { from: old.cargo, to: novo_cargo };
  if (nova_loja !== undefined && nova_loja !== old.loja) changes.loja = { from: old.loja, to: nova_loja };
  if (novo_departamento !== undefined && novo_departamento !== old.departamento) changes.departamento = { from: old.departamento, to: novo_departamento };
  if (nova_localizacao !== undefined && nova_localizacao !== old.localizacao) changes.localizacao = { from: old.localizacao, to: nova_localizacao };

  db.items[idx] = {
    ...old,
    usuario: novo_usuario ?? old.usuario,
    cargo: novo_cargo ?? old.cargo,
    loja: nova_loja ?? old.loja,
    departamento: novo_departamento ?? old.departamento,
    localizacao: nova_localizacao ?? old.localizacao,
    updated_at: now(),
  };

  db.history.push({
    id: generateId(),
    item_id,
    action: 'transfer',
    changes,
    usuario_operacao: usuario_operacao || 'Sistema',
    timestamp: now(),
    observacao: motivo || 'Transferência de equipamento',
  });

  writeDB(db);
  return NextResponse.json(db.items[idx]);
}
