import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const t = initTRPC.context<Context>().create();

export const regulationsRouter = t.router({
  getAll: t.procedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return prisma.regulation.findMany({
        where: { orgId: input.orgId },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { rules: true } } },
      });
    }),

  getById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.regulation.findUnique({
        where: { id: input.id },
        include: { rules: true },
      });
    }),

  getByShareToken: t.procedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      return prisma.regulation.findUnique({
        where: { shareToken: input.token },
        include: { rules: true },
      });
    }),

  create: t.procedure
    .input(z.object({
      orgId: z.string(),
      name: z.string().min(1),
      tone: z.enum(["DESU_MASU", "DA_DEARU", "MIXED"]).default("DESU_MASU"),
    }))
    .mutation(async ({ input }) => {
      return prisma.regulation.create({ data: input });
    }),

  update: t.procedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      tone: z.enum(["DESU_MASU", "DA_DEARU", "MIXED"]).optional(),
      status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.regulation.update({ where: { id }, data });
    }),

  generateShareToken: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const token = crypto.randomBytes(32).toString("hex");
      return prisma.regulation.update({
        where: { id: input.id },
        data: { shareToken: token },
      });
    }),

  addRule: t.procedure
    .input(z.object({
      regulationId: z.string(),
      ruleType: z.enum(["NG_WORD", "EXPRESSION_UNIFY", "REQUIRED_ELEMENT", "STYLE_GUIDE"]),
      ruleKey: z.string().min(1),
      ruleValue: z.string().min(1),
      severity: z.enum(["ERROR", "WARNING", "NOTICE"]).default("WARNING"),
    }))
    .mutation(async ({ input }) => {
      return prisma.regulationRule.create({ data: input });
    }),

  deleteRule: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.regulationRule.delete({ where: { id: input.id } });
    }),
});
