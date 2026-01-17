import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "usuario";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "usuario";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "usuario";
  }
}
