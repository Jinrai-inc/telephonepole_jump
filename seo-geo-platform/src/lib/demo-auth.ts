/**
 * デモ認証システム
 * Supabase未設定時のテスト用認証
 */

export interface DemoUser {
  id: string;
  email: string;
  companyName: string;
  lastName: string;
  firstName: string;
  phone: string;
  plan: "STARTER" | "BUSINESS" | "AGENCY" | "ENTERPRISE";
}

// テスト用アカウント
export const DEMO_ACCOUNTS: Record<string, { password: string; user: DemoUser }> = {
  "enterprise@test.seogeo.jp": {
    password: "Enterprise2024!",
    user: {
      id: "demo-enterprise-001",
      email: "enterprise@test.seogeo.jp",
      companyName: "株式会社テストエンタープライズ",
      lastName: "田中",
      firstName: "太郎",
      phone: "03-1234-5678",
      plan: "ENTERPRISE",
    },
  },
};

export const SESSION_COOKIE_NAME = "demo-session";

export function validateCredentials(email: string, password: string): DemoUser | null {
  const account = DEMO_ACCOUNTS[email];
  if (account && account.password === password) {
    return account.user;
  }
  return null;
}

export function createSessionToken(user: DemoUser): string {
  // Base64エンコードの簡易セッション（デモ用）
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export function parseSessionToken(token: string): DemoUser | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}
