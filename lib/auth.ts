import { NextAuthOptions } from "next-auth";
import { pool } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

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
        const email = String(credentials.email);
        const password = String(credentials.password);

        const [rows] = await pool.query(
          "SELECT id,name, email, password_hash, role FROM users WHERE email = ? limit 1",
          [email],
        );

        const users = rows as {
          id: string;
          name: string;
          email: string;
          password_hash: string;
          role: "ADMIN" | "USER" | "AGENT";
        }[];

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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user;
        token.id = authUser.id;
        token.role = authUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER" | "AGENT";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
