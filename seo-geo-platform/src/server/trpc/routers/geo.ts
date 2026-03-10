import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const geoRouter = t.router({
  getChecks: t.procedure
    .input(z.object({ keywordId: z.string() }))
    .query(async ({ input }) => {
      return prisma.keywordGeoCheck.findMany({
        where: { keywordId: input.keywordId },
        orderBy: { checkedAt: "desc" },
      });
    }),

  getLatestByProject: t.procedure
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
      return keywords.map((kw) => ({
        keywordId: kw.id,
        keyword: kw.keyword,
        geoScore: kw.geoScore ? Number(kw.geoScore) : null,
        checks: kw.geoChecks.map((c) => ({
          engine: c.engine,
          isMentioned: c.isMentioned,
          mentionType: c.mentionType,
          sentiment: c.sentiment,
          shareOfVoice: c.shareOfVoice ? Number(c.shareOfVoice) : null,
          checkedAt: c.checkedAt,
        })),
      }));
    }),

  getScoreHistory: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const keywords = await prisma.keyword.findMany({
        where: { projectId: input.projectId },
        include: {
          geoChecks: { orderBy: { checkedAt: "asc" } },
        },
      });
      return keywords;
    }),
});
