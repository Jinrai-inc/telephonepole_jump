import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const reportsRouter = t.router({
  getAll: t.procedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input }) => {
      return prisma.report.findMany({
        where: { projectId: input.projectId },
        orderBy: { generatedAt: "desc" },
      });
    }),

  generate: t.procedure
    .input(z.object({
      projectId: z.string(),
      orgId: z.string(),
      reportType: z.enum(["TECHNICAL_SEO", "MONTHLY", "KEYWORD", "GEO"]),
      whiteLabel: z.boolean().default(false),
      customLogoUrl: z.string().optional(),
      customCompanyName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.report.create({ data: input });
    }),

  getDownloadUrl: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const report = await prisma.report.findUnique({ where: { id: input.id } });
      return { url: report?.fileUrl ?? null };
    }),

  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.report.delete({ where: { id: input.id } });
    }),
});
