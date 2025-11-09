import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { isBuildTime } from "@/lib/build-guard";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

  const body = await request.json();
  const amount = body.amount;
  const autoTopup = body.autoTopup || false;
  const autoTopupThreshold = body.autoTopupThreshold || null;
  const autoTopupAmount = body.autoTopupAmount || null;
  const invoiceRequired = body.invoiceRequired || false;
  const promoCode = body.promoCode || null;

    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: "Minimum amount is $5" },
        { status: 400 }
      );
    }

    // Skip Stripe session creation during build (deployment) to avoid SDK initialization
    if (isBuildTime()) {
      return NextResponse.json({
        sessionId: "build-time-placeholder",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app"}/dashboard/add-credits/success?session_id=build`,
        buildSafe: true
      });
    }

    const stripe = await getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Skyphone Credits",
              description: `Add $${amount} to your Skyphone account`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/add-credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/add-credits`,
      metadata: {
        userId: user.id,
        amount: amount.toString(),
        purchaseType: "credits",
        autoTopup: autoTopup ? "true" : "false",
        autoTopupThreshold: autoTopupThreshold ? autoTopupThreshold.toString() : "",
        autoTopupAmount: autoTopupAmount ? autoTopupAmount.toString() : "",
        invoiceRequired: invoiceRequired ? "true" : "false",
        promoCode: promoCode || "",
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
