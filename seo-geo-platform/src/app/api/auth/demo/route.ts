import { NextRequest, NextResponse } from "next/server";
import {
  validateCredentials,
  createSessionToken,
  DEMO_ACCOUNTS,
  SESSION_COOKIE_NAME,
  type DemoUser,
} from "@/lib/demo-auth";
import { prisma } from "@/lib/prisma";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7日
};

/**
 * サインアップ時にPrisma DBへUser/Organization/OrgMember/Projectを作成
 */
async function ensureDbRecords(user: DemoUser, companyName: string, domain?: string) {
  try {
    // 既存ユーザーをチェック
    const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

    if (existingUser) {
      // 既存ユーザーの場合はorg/projectを取得
      const membership = await prisma.orgMember.findFirst({
        where: { userId: existingUser.id },
        include: {
          org: {
            include: { projects: { take: 1, orderBy: { createdAt: "desc" } } },
          },
        },
      });
      if (membership) {
        user.id = existingUser.id;
        user.orgId = membership.orgId;
        user.projectId = membership.org.projects[0]?.id ?? "";
      }
      return;
    }

    // 新規ユーザー作成（トランザクション）
    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: `${user.lastName} ${user.firstName}`,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: companyName,
          plan: "STARTER",
        },
      });

      await tx.orgMember.create({
        data: {
          orgId: org.id,
          userId: dbUser.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      });

      const project = await tx.project.create({
        data: {
          orgId: org.id,
          name: `${companyName}のサイト`,
          domain: domain || "example.com",
        },
      });

      return { userId: dbUser.id, orgId: org.id, projectId: project.id };
    });

    user.id = result.userId;
    user.orgId = result.orgId;
    user.projectId = result.projectId;
  } catch (error) {
    console.error("[auth] DB record creation failed:", error);
    // DB接続失敗時はデモモードで続行（orgId/projectIdは空のまま）
  }
}

/**
 * ログイン時にDBからユーザー情報を取得してorgId/projectIdを補完
 */
async function loadDbContext(user: DemoUser) {
  try {
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) return;

    user.id = dbUser.id;

    const membership = await prisma.orgMember.findFirst({
      where: { userId: dbUser.id },
      include: {
        org: {
          include: { projects: { take: 1, orderBy: { createdAt: "desc" } } },
        },
      },
    });

    if (membership) {
      user.orgId = membership.orgId;
      user.projectId = membership.org.projects[0]?.id ?? "";
    }
  } catch (error) {
    console.error("[auth] DB context load failed:", error);
  }
}

// POST /api/auth/demo - ログイン/サインアップ/ログアウト
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "login") {
    const { email, password } = body;
    const user = validateCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    // DBからorgId/projectIdを取得
    await loadDbContext(user);

    const token = createSessionToken(user);
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
    return res;
  }

  if (action === "signup") {
    const { email, companyName, lastName, firstName, phone, password } = body;

    // 既存アカウントチェック
    if (DEMO_ACCOUNTS[email]) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    // デモ用：新規登録をメモリに追加
    const newUser: DemoUser = {
      id: `demo-${Date.now()}`,
      email,
      companyName,
      lastName,
      firstName,
      phone,
      plan: "STARTER",
      orgId: "",
      projectId: "",
    };

    // DBにレコード作成
    await ensureDbRecords(newUser, companyName);

    DEMO_ACCOUNTS[email] = { password, user: newUser };

    const token = createSessionToken(newUser);
    const res = NextResponse.json({ user: newUser });
    res.cookies.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
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
