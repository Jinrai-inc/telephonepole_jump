export async function sendChatworkNotification(
  webhookUrl: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `body=${encodeURIComponent(message)}`,
    });
    return res.ok;
  } catch (error) {
    console.error("Chatwork notification failed:", error);
    return false;
  }
}

export function formatRankChangeChatwork(
  keyword: string,
  previousPosition: number,
  currentPosition: number,
  domain: string
): string {
  const change = previousPosition - currentPosition;
  const direction = change > 0 ? "上昇" : "下降";
  return `[info][title]順位変動通知[/title]ドメイン: ${domain}\nキーワード: ${keyword}\n${previousPosition}位 → ${currentPosition}位 (${Math.abs(change)}${direction})[/info]`;
}
