import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const auditRouter = t.router({
  getLatest: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return prisma.siteAudit.findFirst({
        where: { projectId: input.projectId },
        orderBy: { crawledAt: "desc" },
        include: { issues: true },
      });
    }),

  getAll: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return prisma.siteAudit.findMany({
        where: { projectId: input.projectId },
        orderBy: { crawledAt: "desc" },
      });
    }),

  getIssues: t.procedure
    .input(z.object({
      auditId: z.string(),
      severity: z.enum(["ERROR", "WARNING", "NOTICE"]).optional(),
    }))
    .query(async ({ input }) => {
      return prisma.auditIssue.findMany({
        where: {
          auditId: input.auditId,
          ...(input.severity ? { severity: input.severity } : {}),
        },
        orderBy: { severity: "asc" },
      });
    }),

  resolveIssue: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.auditIssue.update({
        where: { id: input.id },
        data: { isResolved: true },
      });
    }),

  startCrawl: t.procedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
      });
      if (!project) throw new Error("Project not found");

      // 新規監査レコードを作成（クロール中ステータス）
      const audit = await prisma.siteAudit.create({
        data: {
          projectId: input.projectId,
          healthScore: 0,
          pagesCrawled: 0,
          mobileScore: 0,
          desktopScore: 0,
        },
      });

      return { auditId: audit.id, status: "crawling" };
    }),
});
