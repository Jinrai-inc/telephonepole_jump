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

  // シークレット未設定時は本番環境では拒否
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[webhook] PAYJP_WEBHOOK_SECRET not configured in production");
      return false;
    }
    console.warn("[webhook] PAYJP_WEBHOOK_SECRET not configured, skipping verification (dev only)");
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

  try {
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
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
            // orgIdの存在確認
            const org = await prisma.organization.findUnique({
              where: { id: metadata.orgId },
            });
            if (org) {
              const planConfig = PLANS[plan];
              await prisma.organization.update({
                where: { id: metadata.orgId },
                data: {
                  plan,
                  payjpCustomerId: customerId,
                  maxProjects: planConfig.maxProjects,
                  maxKeywords: planConfig.maxKeywords,
                  maxGeoChecks: planConfig.maxGeoChecks,
                },
              });
            } else {
              console.error(`[webhook] Organization not found: ${metadata.orgId}`);
            }
          } else {
            console.error(`[webhook] Invalid plan: ${metadata.plan}`);
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
