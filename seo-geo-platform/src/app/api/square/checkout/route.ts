import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

function getSquareClient() {
  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN || "",
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
}

function getPlanMap(): Record<string, string> {
  return {
    STARTER: process.env.SQUARE_PLAN_STARTER_ID || "",
    BUSINESS: process.env.SQUARE_PLAN_BUSINESS_ID || "",
    AGENCY: process.env.SQUARE_PLAN_AGENCY_ID || "",
  };
}

/**
 * POST /api/square/checkout
 * Creates a Square Checkout link for plan subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId, plan } = await request.json();

    if (!orgId || !plan) {
      return NextResponse.json(
        { error: "orgId and plan are required" },
        { status: 400 }
      );
    }

    const planVariationId = getPlanMap()[plan];
    if (!planVariationId) {
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

    const square = getSquareClient();
    const locationId = process.env.SQUARE_LOCATION_ID || "";
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create or retrieve Square customer
    let customerId = org.squareCustomerId;
    if (!customerId) {
      const result = await square.customers.create({
        idempotencyKey: randomUUID(),
        referenceId: orgId,
        companyName: org.name,
      });
      customerId = result.customer?.id || null;
      if (customerId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: { squareCustomerId: customerId },
        });
      }
    }

    // Create a checkout link using Square Checkout API
    const result = await square.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId,
        lineItems: [
          {
            catalogObjectId: planVariationId,
            quantity: "1",
          },
        ],
        metadata: {
          orgId,
          plan,
        },
      },
      checkoutOptions: {
        redirectUrl: `${appUrl}/settings?checkout=success`,
        askForShippingAddress: false,
      },
    });

    return NextResponse.json({ url: result.paymentLink?.url });
  } catch (error) {
    console.error("Square checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
