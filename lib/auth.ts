import { getServerSession, NextAuthOptions } from "next-auth";
import { query } from "@/lib/db/mariadb";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "./next-auth";
import { ROUTES } from "./routes";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email.toLowerCase();
        const password = credentials.password;
        try {
          const users = await query<{
            id: string;
            name: string;
            email: string;
            password_hash: string;
            role: UserRole;
          }>(
            "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
            [email],
          );

          const user = users[0];

          if (!user) {
            return null;
          }
          const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash,
          );
          if (!isValidPassword) {
            return null;
          }
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Error during user authorization", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: ROUTES.LOGIN,
  },
};
