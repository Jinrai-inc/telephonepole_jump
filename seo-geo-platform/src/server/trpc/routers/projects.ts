import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const projectsRouter = t.router({
  getAll: t.procedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return prisma.project.findMany({
        where: { orgId: input.orgId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { keywords: true } },
        },
      });
    }),

  getById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.project.findUnique({
        where: { id: input.id },
        include: {
          _count: { select: { keywords: true, pages: true } },
        },
      });
    }),

  create: t.procedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(1),
        domain: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.project.create({ data: input });
    }),

  update: t.procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        domain: z.string().optional(),
        gscPropertyUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.project.update({ where: { id }, data });
    }),

  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.project.delete({ where: { id: input.id } });
    }),
});
