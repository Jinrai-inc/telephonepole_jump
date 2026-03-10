import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSerpResults } from "@/server/services/dataForSeo";

/**
 * Cron endpoint for daily ranking checks.
 * Configure Vercel Cron to call this at 6:00 AM JST daily.
 * vercel.json: { "crons": [{ "path": "/api/cron/rankings", "schedule": "0 21 * * *" }] }
 * (21:00 UTC = 06:00 JST)
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all active projects with their keywords
  const projects = await prisma.project.findMany({
    include: { keywords: true },
  });

  let totalProcessed = 0;
  let totalErrors = 0;
  const alerts: { keyword: string; domain: string; oldPos: number; newPos: number; change: number }[] = [];

  for (const project of projects) {
    for (const kw of project.keywords) {
      try {
        // Skip if already fetched today
        const existing = await prisma.keywordRanking.findUnique({
          where: { keywordId_date: { keywordId: kw.id, date: today } },
        });
        if (existing) continue;

        const serp = await getSerpResults(kw.keyword);
        let positionGoogle: number | null = null;
        let hasAiOverview = false;

        if (serp?.items) {
          for (const item of serp.items) {
            if (item.url?.includes(project.domain)) {
              positionGoogle = item.rank_absolute ?? item.position ?? null;
              break;
            }
          }
        }
        if (serp && "hasAiOverview" in serp) {
          hasAiOverview = !!serp.hasAiOverview;
        }

        await prisma.keywordRanking.create({
          data: {
            keywordId: kw.id,
            date: today,
            positionGoogle,
            positionDesktop: positionGoogle,
            hasAiOverview,
          },
        });

        // Check for significant change (threshold: 5 positions)
        const oldPos = kw.currentPosition;
        if (oldPos && positionGoogle) {
          const change = oldPos - positionGoogle;
          if (Math.abs(change) >= 5) {
            alerts.push({
              keyword: kw.keyword,
              domain: project.domain,
              oldPos,
              newPos: positionGoogle,
              change,
            });
          }
        }

        // Update keyword
        const updateData: { currentPosition: number | null; bestPosition?: number } = {
          currentPosition: positionGoogle,
        };
        if (positionGoogle && (!kw.bestPosition || positionGoogle < kw.bestPosition)) {
          updateData.bestPosition = positionGoogle;
        }
        await prisma.keyword.update({
          where: { id: kw.id },
          data: updateData,
        });

        totalProcessed++;
      } catch (error) {
        console.error(`Error fetching rank for "${kw.keyword}":`, error);
        totalErrors++;
      }
    }
  }

  // Send alerts via configured notification channels
  if (alerts.length > 0) {
    await sendAlerts(alerts);
  }

  return NextResponse.json({
    date: today.toISOString(),
    projects: projects.length,
    keywordsProcessed: totalProcessed,
    errors: totalErrors,
    alerts: alerts.length,
  });
}

async function sendAlerts(
  alerts: { keyword: string; domain: string; oldPos: number; newPos: number; change: number }[]
) {
  // Get all notification settings with Slack webhooks
  const settings = await prisma.notificationSetting.findMany({
    where: {
      notifyRankChange: true,
      channel: "SLACK",
      webhookUrl: { not: null },
    },
  });

  const message = {
    text: `順位変動アラート (${alerts.length}件)`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `順位変動アラート (${alerts.length}件)` },
      },
      ...alerts.map((a) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${a.keyword}* (${a.domain})\n${a.change > 0 ? ":arrow_up:" : ":arrow_down:"} ${a.oldPos}位 → ${a.newPos}位 (${a.change > 0 ? "+" : ""}${a.change})`,
        },
      })),
    ],
  };

  for (const setting of settings) {
    if (!setting.webhookUrl) continue;
    try {
      await fetch(setting.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
    }
  }
}
