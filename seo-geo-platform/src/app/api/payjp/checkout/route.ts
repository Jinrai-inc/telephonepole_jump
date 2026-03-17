import { NextRequest, NextResponse } from "next/server";
import Payjp from "payjp";
import { prisma } from "@/lib/prisma";

function getPayjp() {
  return Payjp(process.env.PAYJP_SECRET_KEY!);
}

function getPlanMap(): Record<string, string> {
  return {
    STARTER: process.env.PAYJP_PLAN_STARTER_ID || "",
    BUSINESS: process.env.PAYJP_PLAN_BUSINESS_ID || "",
    AGENCY: process.env.PAYJP_PLAN_AGENCY_ID || "",
  };
}

/**
 * POST /api/payjp/checkout
 * Creates a PAY.JP customer + subscription for plan.
 * Expects { orgId, plan, token } where token is from PAY.JP Checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId, plan, token } = await request.json();

    if (!orgId || !plan || !token) {
      return NextResponse.json(
        { error: "orgId, plan, and token are required" },
        { status: 400 }
      );
    }

    const planId = getPlanMap()[plan];
    if (!planId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Create or retrieve PAY.JP customer
    let customerId = org.payjpCustomerId;
    if (!customerId) {
      const customer = await getPayjp().customers.create({
        card: token,
        metadata: { orgId },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: orgId },
        data: { payjpCustomerId: customerId },
      });
    } else {
      // Update card for existing customer
      await getPayjp().customers.update(customerId, {
        card: token,
      });
    }

    // Create subscription
    const subscription = await getPayjp().subscriptions.create({
      customer: customerId,
      plan: planId,
      metadata: { orgId, plan },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error("PAY.JP checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
