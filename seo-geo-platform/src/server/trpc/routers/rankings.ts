import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

const t = initTRPC.context<Context>().create();

export const rankingsRouter = t.router({
  getHistory: t.procedure
    .input(z.object({
      keywordId: z.string(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const since = subDays(new Date(), input.days);
      const rankings = await prisma.keywordRanking.findMany({
        where: {
          keywordId: input.keywordId,
          date: { gte: since },
        },
        orderBy: { date: "asc" },
      });
      return rankings.map((r) => ({
        date: r.date.toISOString().split("T")[0],
        positionGoogle: r.positionGoogle,
        positionYahoo: r.positionYahoo,
        positionMobile: r.positionMobile,
        positionDesktop: r.positionDesktop,
        hasAiOverview: r.hasAiOverview,
        aiOverviewPosition: r.aiOverviewPosition,
      }));
    }),

  getLatest: t.procedure
    .input(z.object({ keywordId: z.string() }))
    .query(async ({ input }) => {
      return prisma.keywordRanking.findFirst({
        where: { keywordId: input.keywordId },
        orderBy: { date: "desc" },
      });
    }),

  getSummary: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const keywords = await prisma.keyword.findMany({
        where: { projectId: input.projectId },
        select: { currentPosition: true },
      });

      const distribution = { top3: 0, top10: 0, top50: 0, top100: 0, outOfRange: 0 };
      for (const kw of keywords) {
        const pos = kw.currentPosition;
        if (!pos) { distribution.outOfRange++; continue; }
        if (pos <= 3) distribution.top3++;
        else if (pos <= 10) distribution.top10++;
        else if (pos <= 50) distribution.top50++;
        else if (pos <= 100) distribution.top100++;
        else distribution.outOfRange++;
      }
      return distribution;
    }),

  getChanges: t.procedure
    .input(z.object({
      projectId: z.string(),
      threshold: z.number().default(5),
    }))
    .query(async ({ input }) => {
      const keywords = await prisma.keyword.findMany({
        where: { projectId: input.projectId },
        include: {
          rankings: { orderBy: { date: "desc" }, take: 2 },
        },
      });

      return keywords
        .filter((kw) => {
          if (kw.rankings.length < 2) return false;
          const current = kw.rankings[0]?.positionGoogle;
          const previous = kw.rankings[1]?.positionGoogle;
          if (!current || !previous) return false;
          return Math.abs(current - previous) >= input.threshold;
        })
        .map((kw) => ({
          id: kw.id,
          keyword: kw.keyword,
          currentPosition: kw.rankings[0]?.positionGoogle,
          previousPosition: kw.rankings[1]?.positionGoogle,
          change: (kw.rankings[1]?.positionGoogle ?? 0) - (kw.rankings[0]?.positionGoogle ?? 0),
        }))
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }),
});
