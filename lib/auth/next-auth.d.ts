import { DefaultSession } from "next-auth";

export type UserRole = "ADMIN" | "USER" | "AGENT";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | null;
    image?: string | null;
    role: UserRole;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
    } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
