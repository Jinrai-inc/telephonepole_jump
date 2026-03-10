interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }>;
}

export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return res.ok;
  } catch (error) {
    console.error("Slack notification failed:", error);
    return false;
  }
}

export function formatRankChangeMessage(
  keyword: string,
  previousPosition: number,
  currentPosition: number,
  domain: string
): SlackMessage {
  const change = previousPosition - currentPosition;
  const emoji = change > 0 ? ":arrow_up:" : ":arrow_down:";
  const direction = change > 0 ? "上昇" : "下降";

  return {
    text: `[${domain}] ${keyword}: ${previousPosition}位 → ${currentPosition}位 (${Math.abs(change)}${direction})`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *順位変動通知*\n*${keyword}*\n${previousPosition}位 → ${currentPosition}位 (${Math.abs(change)}${direction})`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*ドメイン:*\n${domain}` },
          { type: "mrkdwn", text: `*変動幅:*\n${Math.abs(change)}` },
        ],
      },
    ],
  };
}

export function formatGeoChangeMessage(
  keyword: string,
  engine: string,
  isMentioned: boolean,
  domain: string
): SlackMessage {
  const status = isMentioned ? "言及あり :white_check_mark:" : "言及なし :x:";
  return {
    text: `[${domain}] GEO: ${keyword} - ${engine}: ${status}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:robot_face: *GEO変動通知*\n*${keyword}*\n${engine}: ${status}`,
        },
      },
    ],
  };
}
