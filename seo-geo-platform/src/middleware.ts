import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/demo-auth";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");
  const isSharedPage = req.nextUrl.pathname.startsWith("/shared");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  const isLandingPage = req.nextUrl.pathname === "/lp";

  if (isSharedPage || isApiRoute || isLandingPage) {
    return res;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase設定がある場合はSupabase認証を試行
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            res = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Supabase認証成功
        if (isAuthPage) {
          return NextResponse.redirect(new URL("/", req.url));
        }
        return res;
      }
    } catch {
      // Supabase認証に失敗 → デモ認証にフォールバック
    }
  }

  // デモ認証モード（Supabase未設定時 or Supabase認証失敗時のフォールバック）
  const demoSession = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!demoSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (demoSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
