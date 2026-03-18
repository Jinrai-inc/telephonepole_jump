/**
 * ログイン通知メール
 * 不正ログイン対策として、ログイン時にメールで通知
 */

import { sendEmailNotification } from "./email";

export async function sendLoginNotification(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const now = new Date();
  const dateStr = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  await sendEmailNotification({
    to: email,
    subject: "[SEO×GEO] ログイン通知",
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #141E2C;">ログイン通知</h2>
        <p>お使いのアカウントにログインがありました。</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">日時</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">IPアドレス</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace;">${ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">ブラウザ</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; font-size: 12px;">${userAgent}</td>
          </tr>
        </table>
        <p style="color: #FF5C5C; font-size: 14px;">
          心当たりがない場合は、直ちにパスワードを変更してください。
        </p>
      </div>
    `,
  });
}
