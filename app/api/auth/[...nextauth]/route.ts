import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { findByUsername, verifyPassword, readUsers, writeUsers } from '@/lib/users';

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET || 'potenza-ti-secret-2025-inventory-system',
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8h session
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = findByUsername(credentials.username);
        if (!user || !user.active) return null;
        if (!verifyPassword(credentials.password, user.password_hash)) return null;

        // Update last_login
        const db = readUsers();
        const idx = db.users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
          db.users[idx].last_login = new Date().toISOString();
          writeUsers(db);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.username, // reuse email field for username
          image: user.role,    // reuse image field for role
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.image; // role stored in image field
        token.username = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
