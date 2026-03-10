import { prisma } from "@/lib/prisma";

export async function createContext() {
  return {
    prisma,
    // TODO: Add user session from Supabase auth
    user: null as { id: string; email: string } | null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
