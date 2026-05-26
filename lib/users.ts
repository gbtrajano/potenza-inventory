import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_PATH = path.join(process.cwd(), 'data', 'users.db');

export interface User {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
  created_at: string;
  last_login?: string;
}

export interface UsersDB {
  users: User[];
}

function ensureDir() {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readUsers(): UsersDB {
  ensureDir();
  if (!fs.existsSync(USERS_PATH)) {
    // Seed default admin on first run
    const defaultAdmin: User = {
      id: 'admin-001',
      username: 'admin',
      name: 'Administrador',
      password_hash: bcrypt.hashSync('Potenza@2026', 10),
      role: 'admin',
      active: true,
      created_at: new Date().toISOString(),
    };
    const db: UsersDB = { users: [defaultAdmin] };
    fs.writeFileSync(USERS_PATH, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8')) as UsersDB;
  } catch {
    return { users: [] };
  }
}

export function writeUsers(db: UsersDB) {
  ensureDir();
  fs.writeFileSync(USERS_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export function findByUsername(username: string): User | undefined {
  const db = readUsers();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function generateId(): string {
  return 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Visualizador',
};

export const ROLE_COLORS: Record<string, string> = {
  admin: '#f59e0b',
  editor: '#3b82f6',
  viewer: '#6b7280',
};

// Permissions
export const CAN_EDIT = ['admin', 'editor'];
export const CAN_ADMIN = ['admin'];
