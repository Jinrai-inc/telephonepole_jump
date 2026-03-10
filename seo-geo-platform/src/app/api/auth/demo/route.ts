import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createSessionToken,
  DEMO_ACCOUNTS,
  SESSION_COOKIE_NAME,
  type DemoUser,
} from "@/lib/demo-auth";

// POST /api/auth/demo - ログイン
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "login") {
    const { email, password } = body;
    const user = validateCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }
    const token = createSessionToken(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7日
    });
    return res;
  }

  if (action === "signup") {
    const { email, companyName, lastName, firstName, phone, password } = body;

    // 既存アカウントチェック
    if (DEMO_ACCOUNTS[email]) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    // デモ用：新規登録をメモリに追加（再起動で消える）
    const newUser: DemoUser = {
      id: `demo-${Date.now()}`,
      email,
      companyName,
      lastName,
      firstName,
      phone,
      plan: "STARTER",
    };
    DEMO_ACCOUNTS[email] = { password, user: newUser };

    const token = createSessionToken(newUser);
    const res = NextResponse.json({ user: newUser });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// GET /api/auth/demo - セッション確認
export async function GET(req: NextRequest) {
  const { parseSessionToken } = await import("@/lib/demo-auth");
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }
  const user = parseSessionToken(token);
  return NextResponse.json({ user });
}
