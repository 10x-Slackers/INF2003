import bcrypt from "bcryptjs";
import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/auth/schemas";
import { isAdmin, isAgent, isSignedIn } from "@/lib/permissions";
import { query } from "@/lib/db";

export type UserRole = "ADMIN" | "AGENT" | "USER";

export async function assertAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.role)) {
    throw new Error("Forbidden");
  }
}

export async function assertAgent() {
  const session = await auth();
  if (!isAgent(session?.user?.role)) {
    throw new Error("Forbidden");
  }
}

export async function assertSignedIn(): Promise<Session> {
  const session = await auth();
  if (!session || !isSignedIn(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const users = await query<DbUser>(
          "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
          [parsed.data.email.toLowerCase()],
        );
        const user = users[0];

        if (!user) return null;

        const validPassword = await bcrypt.compare(
          parsed.data.password,
          user.password_hash,
        );
        if (!validPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
