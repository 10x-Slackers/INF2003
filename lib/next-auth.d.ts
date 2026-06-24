import NextAuth from "next-auth";

export type UserRole = "ADMIN" | "USER" | "AGENT";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
