import bcrypt from "bcryptjs";
import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/auth/schemas";
import { isAdmin, isAgent, isSignedIn } from "@/lib/permissions";
import { query } from "@/lib/db";
import { getUserWithPasswordById } from "@/lib/tables/users";

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

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const user = await getUserWithPasswordById(userId);
  if (!user) return false;
  return verifyPassword(password, user.password_hash);
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

        const validPassword = await verifyPassword(
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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (trigger === "update" && token.id) {
        const users = await query<Pick<DbUser, "name" | "email" | "role">>(
          "SELECT name, email, role FROM users WHERE id = ? LIMIT 1",
          [token.id as string],
        );
        if (users[0]) {
          token.name = users[0].name;
          token.email = users[0].email;
          token.role = users[0].role;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
