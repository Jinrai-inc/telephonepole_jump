import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const keywordsRouter = t.router({
  getAll: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      const keywords = await prisma.keyword.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        include: {
          rankings: {
            orderBy: { date: "desc" },
            take: 2,
          },
        },
      });
      return keywords.map((kw) => ({
        id: kw.id,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume,
        keywordDifficulty: kw.keywordDifficulty ? Number(kw.keywordDifficulty) : null,
        currentPosition: kw.currentPosition,
        bestPosition: kw.bestPosition,
        geoScore: kw.geoScore ? Number(kw.geoScore) : null,
        searchIntent: kw.searchIntent,
        previousPosition: kw.rankings[1]?.positionGoogle ?? null,
      }));
    }),

  create: t.procedure
    .input(z.object({
      projectId: z.string(),
      keyword: z.string().min(1),
      targetUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.keyword.create({
        data: {
          projectId: input.projectId,
          keyword: input.keyword,
          targetUrl: input.targetUrl,
        },
      });
    }),

  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.keyword.delete({ where: { id: input.id } });
    }),

  bulkCreate: t.procedure
    .input(z.object({
      projectId: z.string(),
      keywords: z.array(z.string().min(1)),
    }))
    .mutation(async ({ input }) => {
      const data = input.keywords.map((kw) => ({
        projectId: input.projectId,
        keyword: kw,
      }));
      const result = await prisma.keyword.createMany({
        data,
        skipDuplicates: true,
      });
      return { created: result.count };
    }),

  getById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.keyword.findUnique({
        where: { id: input.id },
        include: { project: true },
      });
    }),
});
