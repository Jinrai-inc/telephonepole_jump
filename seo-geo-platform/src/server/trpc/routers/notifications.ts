import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";

const t = initTRPC.context<Context>().create();

export const notificationsRouter = t.router({
  getSettings: t.procedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ input }) => {
      return prisma.notificationSetting.findMany({
        where: { orgId: input.orgId },
      });
    }),

  updateSettings: t.procedure
    .input(z.object({
      id: z.string(),
      webhookUrl: z.string().optional(),
      notifyRankChange: z.boolean().optional(),
      rankChangeThreshold: z.number().optional(),
      notifyErrors: z.boolean().optional(),
      notifyGeoChange: z.boolean().optional(),
      notifyArticleComplete: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.notificationSetting.update({ where: { id }, data });
    }),

  create: t.procedure
    .input(z.object({
      orgId: z.string(),
      channel: z.enum(["EMAIL", "SLACK", "CHATWORK"]),
      webhookUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return prisma.notificationSetting.create({ data: input });
    }),

  testNotification: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const setting = await prisma.notificationSetting.findUnique({ where: { id: input.id } });
      if (!setting) throw new Error("Notification setting not found");
      // TODO: Actually send test notification
      return { success: true, message: "テスト通知を送信しました" };
    }),
});
