import { prisma } from "@/lib/prisma";
import { sendSlackNotification, formatRankChangeMessage, formatGeoChangeMessage } from "./slack";
import { sendChatworkNotification, formatRankChangeChatwork } from "./chatwork";

type NotificationChannel = "EMAIL" | "SLACK" | "CHATWORK";

interface RankChangeEvent {
  type: "rank_change";
  keyword: string;
  previousPosition: number;
  currentPosition: number;
  domain: string;
}

interface GeoChangeEvent {
  type: "geo_change";
  keyword: string;
  engine: string;
  isMentioned: boolean;
  domain: string;
}

interface ErrorEvent {
  type: "error";
  message: string;
  domain: string;
}

type NotificationEvent = RankChangeEvent | GeoChangeEvent | ErrorEvent;

export async function sendNotifications(
  orgId: string,
  event: NotificationEvent
): Promise<void> {
  const settings = await prisma.notificationSetting.findMany({
    where: { orgId },
  });

  for (const setting of settings) {
    if (!setting.webhookUrl) continue;

    const shouldNotify = shouldSendNotification(setting, event);
    if (!shouldNotify) continue;

    try {
      await dispatchNotification(setting.channel as NotificationChannel, setting.webhookUrl, event);
    } catch (error) {
      console.error(`Notification failed for ${setting.channel}:`, error);
    }
  }
}

function shouldSendNotification(
  setting: { notifyRankChange: boolean; rankChangeThreshold: number; notifyErrors: boolean; notifyGeoChange: boolean },
  event: NotificationEvent
): boolean {
  switch (event.type) {
    case "rank_change":
      if (!setting.notifyRankChange) return false;
      const change = Math.abs(event.previousPosition - event.currentPosition);
      return change >= setting.rankChangeThreshold;
    case "geo_change":
      return setting.notifyGeoChange;
    case "error":
      return setting.notifyErrors;
    default:
      return false;
  }
}

async function dispatchNotification(
  channel: NotificationChannel,
  webhookUrl: string,
  event: NotificationEvent
): Promise<void> {
  switch (channel) {
    case "SLACK":
      await sendSlackForEvent(webhookUrl, event);
      break;
    case "CHATWORK":
      await sendChatworkForEvent(webhookUrl, event);
      break;
    case "EMAIL":
      // TODO: Implement email via Resend or similar
      console.log("Email notification not yet implemented");
      break;
  }
}

async function sendSlackForEvent(webhookUrl: string, event: NotificationEvent) {
  switch (event.type) {
    case "rank_change": {
      const msg = formatRankChangeMessage(event.keyword, event.previousPosition, event.currentPosition, event.domain);
      await sendSlackNotification(webhookUrl, msg);
      break;
    }
    case "geo_change": {
      const msg = formatGeoChangeMessage(event.keyword, event.engine, event.isMentioned, event.domain);
      await sendSlackNotification(webhookUrl, msg);
      break;
    }
    case "error": {
      await sendSlackNotification(webhookUrl, {
        text: `:warning: [${event.domain}] エラー: ${event.message}`,
      });
      break;
    }
  }
}

async function sendChatworkForEvent(webhookUrl: string, event: NotificationEvent) {
  switch (event.type) {
    case "rank_change": {
      const msg = formatRankChangeChatwork(event.keyword, event.previousPosition, event.currentPosition, event.domain);
      await sendChatworkNotification(webhookUrl, msg);
      break;
    }
    case "geo_change": {
      const status = event.isMentioned ? "言及あり" : "言及なし";
      const msg = `[info][title]GEO変動通知[/title]キーワード: ${event.keyword}\nエンジン: ${event.engine}\nステータス: ${status}[/info]`;
      await sendChatworkNotification(webhookUrl, msg);
      break;
    }
    case "error": {
      const msg = `[info][title]エラー通知[/title]${event.message}[/info]`;
      await sendChatworkNotification(webhookUrl, msg);
      break;
    }
  }
}
