import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "ADMIN" | "USER" | "AGENT";
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "ADMIN" | "USER" | "AGENT";
    };
  }
  declare module "next-auth/jwt" {
    interface JWT {
      id: string;
      role: "ADMIN" | "USER" | "AGENT";
    }
  }
}
