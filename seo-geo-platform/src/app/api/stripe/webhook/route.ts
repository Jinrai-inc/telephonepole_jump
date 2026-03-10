import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/constants";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  });
}

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan as keyof typeof PLANS | undefined;

      if (orgId && plan && plan in PLANS) {
        const planConfig = PLANS[plan];
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            maxProjects: planConfig.maxProjects,
            maxKeywords: planConfig.maxKeywords,
            maxGeoChecks: planConfig.maxGeoChecks,
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.orgId;

      if (orgId && subscription.status === "active") {
        // Subscription renewed or updated successfully
        console.log(`Subscription active for org: ${orgId}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.orgId;

      if (orgId) {
        // Downgrade to starter plan
        const starterPlan = PLANS.STARTER;
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: "STARTER",
            maxProjects: starterPlan.maxProjects,
            maxKeywords: starterPlan.maxKeywords,
            maxGeoChecks: starterPlan.maxGeoChecks,
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.error(`Payment failed for customer: ${invoice.customer}`);
      // TODO: Send notification to org admin
      break;
    }
  }

  return NextResponse.json({ received: true });
}
