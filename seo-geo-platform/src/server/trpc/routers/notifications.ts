import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { Context } from "../context";
import { prisma } from "@/lib/prisma";
import { sendSlackNotification } from "@/server/services/notifications/slack";
import { sendChatworkNotification } from "@/server/services/notifications/chatwork";
import { sendEmailNotification, formatTestEmail } from "@/server/services/notifications/email";

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

      switch (setting.channel) {
        case "SLACK":
          if (!setting.webhookUrl) throw new Error("Webhook URLが未設定です");
          await sendSlackNotification(setting.webhookUrl, {
            text: "SEO-GEO Platform テスト通知: 通知設定が正常に動作しています。",
          });
          break;
        case "CHATWORK":
          if (!setting.webhookUrl) throw new Error("Webhook URLが未設定です");
          await sendChatworkNotification(
            setting.webhookUrl,
            "[info][title]テスト通知[/title]SEO-GEO Platform の通知設定が正常に動作しています。[/info]"
          );
          break;
        case "EMAIL": {
          if (!setting.webhookUrl) throw new Error("メールアドレスが未設定です");
          const email = formatTestEmail();
          await sendEmailNotification({ ...email, to: setting.webhookUrl });
          break;
        }
      }

      return { success: true, message: "テスト通知を送信しました" };
    }),
});
