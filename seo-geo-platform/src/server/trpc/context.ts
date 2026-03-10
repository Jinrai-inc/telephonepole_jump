import { prisma } from "@/lib/prisma";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/demo-auth";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  let user: { id: string; email: string; orgId: string; projectId: string } | null = null;

  // cookieからデモセッションを取得
  if (opts?.req) {
    const cookieHeader = opts.req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      const sessionUser = parseSessionToken(decodeURIComponent(match[1]));
      if (sessionUser) {
        user = {
          id: sessionUser.id,
          email: sessionUser.email,
          orgId: sessionUser.orgId,
          projectId: sessionUser.projectId,
        };
      }
    }
  }

  return {
    prisma,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
