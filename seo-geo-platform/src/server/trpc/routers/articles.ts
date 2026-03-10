import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const articlesRouter = t.router({
  getAll: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return prisma.article.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        include: { assignee: true, regulation: true },
      });
    }),

  getById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.article.findUnique({
        where: { id: input.id },
        include: { checks: true, regulation: { include: { rules: true } } },
      });
    }),

  create: t.procedure
    .input(z.object({
      projectId: z.string(),
      title: z.string().min(1),
      targetKeyword: z.string().optional(),
      regulationId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.article.create({ data: input });
    }),

  update: t.procedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      contentHtml: z.string().optional(),
      contentText: z.string().optional(),
      structureJson: z.any().optional(),
      status: z.enum(["DRAFT", "WRITING", "PROOFREADING", "REVIEWING", "PUBLISHED"]).optional(),
      wordCount: z.number().optional(),
      seoScore: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.article.update({ where: { id }, data });
    }),

  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.article.delete({ where: { id: input.id } });
    }),

  addCheck: t.procedure
    .input(z.object({
      articleId: z.string(),
      checkType: z.enum(["PROOFREAD", "FACTCHECK", "COPYCHECK", "AI_DETECT"]),
      resultJson: z.any(),
      issuesCount: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      return prisma.articleCheck.create({ data: input });
    }),
});
