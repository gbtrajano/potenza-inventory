import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateId, now } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'inventory.db');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'backup') {
    const db = readDB();
    return new NextResponse(JSON.stringify(db, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup_potenza_${new Date().toISOString().slice(0,10)}.db"`,
      },
    });
  }

  // Return DB info
  const db = readDB();
  const stats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : null;
  return NextResponse.json({
    total_items: db.items.length,
    total_history: db.history.length,
    schema_version: db.schema_version,
    file_size_kb: stats ? Math.round(stats.size / 1024) : 0,
    last_modified: stats ? stats.mtime.toISOString() : null,
    db_path: DB_PATH,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'restore') {
    const { backup } = body;
    try {
      const db = JSON.parse(typeof backup === 'string' ? backup : JSON.stringify(backup));
      writeDB(db);
      return NextResponse.json({ success: true, items: db.items.length });
    } catch (e) {
      return NextResponse.json({ error: 'Invalid backup file' }, { status: 400 });
    }
  }

  if (action === 'clear_history') {
    const db = readDB();
    db.history = [];
    writeDB(db);
    return NextResponse.json({ success: true });
  }

  if (action === 'clear_all') {
    const confirmed = body.confirmed;
    if (!confirmed) return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    writeDB({ items: [], history: [], schema_version: 1 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
