/**
 * Google reCAPTCHA v3 サーバーサイド検証
 */

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/** reCAPTCHA v3のスコア閾値（0.5以上で合格） */
const SCORE_THRESHOLD = 0.5;

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * reCAPTCHAトークンを検証
 * @param token クライアントから送信されたreCAPTCHAトークン
 * @param expectedAction 期待するアクション名（例: "login", "signup"）
 * @returns 検証結果
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string
): Promise<{ valid: boolean; score: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // reCAPTCHA未設定時はスキップ（開発環境用）
  if (!secretKey) {
    console.warn("[recaptcha] RECAPTCHA_SECRET_KEY not configured, skipping verification");
    return { valid: true, score: 1.0 };
  }

  if (!token) {
    return { valid: false, score: 0, error: "reCAPTCHAトークンが必要です" };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data: RecaptchaResponse = await res.json();

    if (!data.success) {
      return {
        valid: false,
        score: 0,
        error: `reCAPTCHA検証失敗: ${data["error-codes"]?.join(", ") || "unknown"}`,
      };
    }

    // スコアチェック
    const score = data.score ?? 0;
    if (score < SCORE_THRESHOLD) {
      return { valid: false, score, error: "Bot検知によりリクエストが拒否されました" };
    }

    // アクション名の検証（指定時）
    if (expectedAction && data.action !== expectedAction) {
      return { valid: false, score, error: "reCAPTCHAアクション不一致" };
    }

    return { valid: true, score };
  } catch (error) {
    console.error("[recaptcha] Verification error:", error);
    // 外部サービス障害時はブロックしない
    return { valid: true, score: 0.5 };
  }
}
