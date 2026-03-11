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
      const report = await prisma.report.create({ data: input });

      // Trigger PDF generation asynchronously
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      }).catch((err) => console.error("PDF generation trigger failed:", err));

      return report;
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
