import { Resend } from "resend";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmailNotification({ to, subject, body }: EmailNotification): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
    to,
    subject,
    html: body,
  });
}

export function formatRankChangeEmail(
  keyword: string,
  previousPosition: number,
  currentPosition: number,
  domain: string
): EmailNotification {
  const direction = currentPosition < previousPosition ? "上昇" : "下降";
  const change = Math.abs(currentPosition - previousPosition);
  return {
    to: "",
    subject: `[${domain}] 順位${direction}通知: ${keyword}`,
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #141E2C;">順位変動通知</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">キーワード</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${keyword}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">ドメイン</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${domain}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">変動</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${currentPosition < previousPosition ? '#3DD68C' : '#FF5C5C'};">${previousPosition}位 → ${currentPosition}位 (${change}${direction})</td></tr>
        </table>
      </div>
    `,
  };
}

export function formatGeoChangeEmail(
  keyword: string,
  engine: string,
  isMentioned: boolean,
  domain: string
): EmailNotification {
  const status = isMentioned ? "言及あり" : "言及なし";
  return {
    to: "",
    subject: `[${domain}] GEO変動通知: ${keyword} (${engine})`,
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #141E2C;">GEO変動通知</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">キーワード</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${keyword}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">エンジン</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${engine}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">ステータス</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${status}</td></tr>
        </table>
      </div>
    `,
  };
}

export function formatErrorEmail(message: string, domain: string): EmailNotification {
  return {
    to: "",
    subject: `[${domain}] エラー通知`,
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF5C5C;">エラー通知</h2>
        <p style="padding: 12px; background: #FFF5F5; border-radius: 8px;">${message}</p>
      </div>
    `,
  };
}

export function formatTestEmail(): EmailNotification {
  return {
    to: "",
    subject: "SEO-GEO Platform テスト通知",
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00E4B8;">テスト通知</h2>
        <p>メール通知が正常に設定されています。</p>
      </div>
    `,
  };
}
