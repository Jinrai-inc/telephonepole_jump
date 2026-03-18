import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/constants";
import { sendNotifications } from "@/server/services/notifications";

/**
 * PAY.JP Webhookシグネチャ検証
 * PAY.JPはHTTPヘッダーにシグネチャを含めて送信する
 */
function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const webhookSecret = process.env.PAYJP_WEBHOOK_SECRET;

  // シークレット未設定時は検証スキップ（開発環境用）
  if (!webhookSecret) {
    console.warn("[webhook] PAYJP_WEBHOOK_SECRET not configured, skipping signature verification");
    return true;
  }

  if (!signature) {
    console.error("[webhook] Missing signature header");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody, "utf-8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/payjp/webhook
 * Handles PAY.JP webhook events for subscription lifecycle.
 *
 * PAY.JP webhook events:
 * - subscription.created / subscription.renewed / subscription.resumed
 * - subscription.canceled / subscription.paused / subscription.deleted
 * - charge.failed
 */
export async function POST(request: NextRequest) {
  try {
    // シグネチャ検証
    const rawBody = await request.text();
    const signature = request.headers.get("x-payjp-webhook-token");

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.type;

    switch (eventType) {
      case "subscription.created":
      case "subscription.renewed":
      case "subscription.resumed": {
        const subscription = event.data;
        const customerId: string | undefined = subscription?.customer;
        const metadata = subscription?.metadata;

        if (customerId && metadata?.orgId && metadata?.plan) {
          const plan = metadata.plan as keyof typeof PLANS;
          if (plan in PLANS) {
            const planConfig = PLANS[plan];
            await prisma.organization.update({
              where: { id: metadata.orgId },
              data: {
                plan,
                maxProjects: planConfig.maxProjects,
                maxKeywords: planConfig.maxKeywords,
                maxGeoChecks: planConfig.maxGeoChecks,
              },
            });
          }
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.paused":
      case "subscription.deleted": {
        const subscription = event.data;
        const customerId: string | undefined = subscription?.customer;

        if (customerId) {
          const org = await prisma.organization.findFirst({
            where: { payjpCustomerId: customerId },
          });
          if (org) {
            const starterPlan = PLANS.STARTER;
            await prisma.organization.update({
              where: { id: org.id },
              data: {
                plan: "STARTER",
                maxProjects: starterPlan.maxProjects,
                maxKeywords: starterPlan.maxKeywords,
                maxGeoChecks: starterPlan.maxGeoChecks,
              },
            });
          }
        }
        break;
      }

      case "charge.failed": {
        const charge = event.data;
        const customerId: string | undefined = charge?.customer;

        if (customerId) {
          const org = await prisma.organization.findFirst({
            where: { payjpCustomerId: customerId },
          });
          if (org) {
            await sendNotifications(org.id, {
              type: "error",
              message: "決済に失敗しました。お支払い方法をご確認ください。",
              domain: org.name,
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PAY.JP webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
