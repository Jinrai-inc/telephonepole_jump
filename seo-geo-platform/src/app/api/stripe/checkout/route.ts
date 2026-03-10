import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia" as Stripe.LatestApiVersion,
  });
}

function getPriceMap(): Record<string, string> {
  return {
    STARTER: process.env.STRIPE_PRICE_STARTER || "",
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS || "",
    AGENCY: process.env.STRIPE_PRICE_AGENCY || "",
  };
}

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for plan subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId, plan } = await request.json();

    if (!orgId || !plan) {
      return NextResponse.json({ error: "orgId and plan are required" }, { status: 400 });
    }

    const priceId = getPriceMap()[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const stripe = getStripe();

    // Create or retrieve Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { orgId },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        trial_period_days: 7,
        metadata: { orgId, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
