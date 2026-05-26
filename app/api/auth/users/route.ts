import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readUsers, writeUsers, hashPassword, generateId, User } from '@/lib/users';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const db = readUsers();
  // Never return password hashes
  const safe = db.users.map(({ password_hash, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

  const body = await req.json();
  const { action } = body;

  const db = readUsers();

  if (action === 'create') {
    const { username, name, password, role } = body;
    if (!username || !name || !password || !role) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 });
    }
    const user: User = {
      id: generateId(),
      username: username.toLowerCase().trim(),
      name: name.trim(),
      password_hash: hashPassword(password),
      role,
      active: true,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    writeUsers(db);
    const { password_hash, ...safe } = user;
    return NextResponse.json(safe, { status: 201 });
  }

  if (action === 'update') {
    const { id, name, role, active, password } = body;
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    if (name) db.users[idx].name = name.trim();
    if (role) db.users[idx].role = role;
    if (typeof active === 'boolean') db.users[idx].active = active;
    if (password) db.users[idx].password_hash = hashPassword(password);

    writeUsers(db);
    const { password_hash, ...safe } = db.users[idx];
    return NextResponse.json(safe);
  }

  if (action === 'delete') {
    const { id } = body;
    // Prevent deleting last admin
    const admins = db.users.filter(u => u.role === 'admin' && u.active);
    const target = db.users.find(u => u.id === id);
    if (target?.role === 'admin' && admins.length <= 1) {
      return NextResponse.json({ error: 'Não é possível remover o último administrador' }, { status: 400 });
    }
    db.users = db.users.filter(u => u.id !== id);
    writeUsers(db);
    return NextResponse.json({ success: true });
  }

  if (action === 'change_password_self') {
    // Any logged-in user can change their own password
    const anySession = await getServerSession();
    if (!anySession) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    const username = (anySession.user as any)?.username;
    const { current_password, new_password } = body;
    const idx = db.users.findIndex(u => u.username === username);
    if (idx === -1) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    const { verifyPassword } = await import('@/lib/users');
    if (!verifyPassword(current_password, db.users[idx].password_hash)) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
    }
    db.users[idx].password_hash = hashPassword(new_password);
    writeUsers(db);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
}
