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

const ALLOWED_TDS_STATUSES = new Set(["verified", "attempted"]);

/**
 * POST /api/payjp/checkout
 * Creates a PAY.JP customer + subscription for plan.
 * Expects { orgId, plan, token } where token is from PAY.JP with 3D Secure.
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

    const payjp = getPayjp();

    // 3Dセキュア検証: トークンを取得してステータスを確認
    const tokenObj = await payjp.tokens.retrieve(token);
    const tdsStatus = tokenObj.card?.three_d_secure_status;

    if (!tdsStatus || !ALLOWED_TDS_STATUSES.has(tdsStatus)) {
      return NextResponse.json(
        { error: `3Dセキュア認証が完了していません (status: ${tdsStatus ?? "null"})` },
        { status: 400 }
      );
    }

    // 3Dセキュア完了処理
    await payjp.tokens.tds_finish(token);

    // Create or retrieve PAY.JP customer
    let customerId = org.payjpCustomerId;
    if (!customerId) {
      const customer = await payjp.customers.create({
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
      await payjp.customers.update(customerId, {
        card: token,
      });
    }

    // Create subscription
    const subscription = await payjp.subscriptions.create({
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
    const message = error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
