import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment, WebhooksHelper } from "square";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/constants";
import { sendNotifications } from "@/server/services/notifications";

function getSquareClient() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN || "",
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
}

/**
 * POST /api/square/webhook
 * Handles Square webhook events for subscription lifecycle.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  // Verify webhook signature
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "";
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/webhook`;

  const isValid = await WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: signature,
    signatureKey,
    notificationUrl,
  });

  if (!isValid) {
    console.error("Webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const event = JSON.parse(body);
  const eventType: string = event.type;

  switch (eventType) {
    case "payment.completed": {
      // Payment completed - update organization plan
      const payment = event.data?.object?.payment;
      const orderId = payment?.orderId;

      if (orderId) {
        const square = getSquareClient();
        const result = await square.orders.get(orderId);
        const metadata = result.order?.metadata;

        if (metadata?.orgId && metadata?.plan) {
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
      }
      break;
    }

    case "subscription.updated": {
      const subscription = event.data?.object?.subscription;
      const customerId = subscription?.customerId;

      if (customerId && subscription?.status === "ACTIVE") {
        console.log(`Subscription active for customer: ${customerId}`);
      }
      break;
    }

    case "subscription.created": {
      const subscription = event.data?.object?.subscription;
      const customerId = subscription?.customerId;

      if (customerId) {
        console.log(`Subscription created for customer: ${customerId}`);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data?.object?.invoice;
      const customerId = invoice?.primaryRecipient?.customerId;

      if (customerId) {
        const org = await prisma.organization.findFirst({
          where: { squareCustomerId: customerId },
        });
        if (org) {
          await sendNotifications(org.id, {
            type: "error",
            message:
              "決済に失敗しました。お支払い方法をご確認ください。",
            domain: org.name,
          });
        }
      }
      break;
    }

    case "subscription.stopped":
    case "subscription.canceled": {
      const subscription = event.data?.object?.subscription;
      const customerId = subscription?.customerId;

      if (customerId) {
        const org = await prisma.organization.findFirst({
          where: { squareCustomerId: customerId },
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
  }

  return NextResponse.json({ received: true });
}
