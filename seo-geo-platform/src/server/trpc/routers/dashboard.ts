import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const dashboardRouter = t.router({
  getSummary: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const [keywords, latestAudit, geoScores] = await Promise.all([
        prisma.keyword.findMany({
          where: { projectId: input.projectId },
          select: { currentPosition: true, geoScore: true },
        }),
        prisma.siteAudit.findFirst({
          where: { projectId: input.projectId },
          orderBy: { crawledAt: "desc" },
          select: { healthScore: true },
        }),
        prisma.keyword.findMany({
          where: { projectId: input.projectId, geoScore: { not: null } },
          select: { geoScore: true },
        }),
      ]);

      const totalKeywords = keywords.length;
      const top10Keywords = keywords.filter(
        (kw) => kw.currentPosition !== null && kw.currentPosition <= 10
      ).length;
      const avgGeoScore =
        geoScores.length > 0
          ? Math.round(
              geoScores.reduce((sum, kw) => sum + Number(kw.geoScore), 0) /
                geoScores.length
            )
          : null;
      const siteHealth = latestAudit?.healthScore
        ? Number(latestAudit.healthScore)
        : null;

      return { totalKeywords, top10Keywords, avgGeoScore, siteHealth };
    }),

  getRecentChanges: t.procedure
    .input(z.object({ projectId: z.string(), limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const keywords = await prisma.keyword.findMany({
        where: { projectId: input.projectId },
        include: {
          rankings: { orderBy: { date: "desc" }, take: 2 },
        },
      });

      return keywords
        .filter((kw) => kw.rankings.length >= 2)
        .map((kw) => {
          const current = kw.rankings[0]?.positionGoogle ?? null;
          const previous = kw.rankings[1]?.positionGoogle ?? null;
          const change =
            current !== null && previous !== null ? previous - current : 0;
          return { id: kw.id, keyword: kw.keyword, currentPosition: current, previousPosition: previous, change };
        })
        .filter((kw) => kw.change !== 0)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, input.limit);
    }),

  getGeoSummary: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const keywords = await prisma.keyword.findMany({
        where: { projectId: input.projectId },
        include: {
          geoChecks: {
            orderBy: { checkedAt: "desc" },
            take: 5,
          },
        },
      });

      const mentioned = keywords.filter((kw) =>
        kw.geoChecks.some((c) => c.isMentioned)
      );

      return {
        totalChecked: keywords.filter((kw) => kw.geoChecks.length > 0).length,
        mentionedCount: mentioned.length,
        engines: ["ChatGPT", "Gemini", "Perplexity", "Copilot", "Claude"],
      };
    }),
});
