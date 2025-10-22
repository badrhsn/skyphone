import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { purchasePhoneNumber } from "@/lib/twilio";
import { getStripe } from "@/lib/stripe";
import { processPaymentWithAutoTopup } from "@/lib/auto-topup";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, country, countryCode, city, type, monthlyPrice, setupFee, capabilities, paymentMethod } = body;

    // Validate required fields
    if (!phoneNumber || !country || !countryCode || !monthlyPrice || !setupFee) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalCost = monthlyPrice + setupFee;

    // Check if phone number already exists
    const existingNumber = await prisma.phoneNumber.findUnique({
      where: { phoneNumber }
    });

    if (existingNumber) {
      return NextResponse.json({ error: "Phone number already purchased" }, { status: 400 });
    }

    // Always use Stripe checkout for phone number purchases
    try {
      const stripe = await getStripe();
      const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Phone Number Purchase`,
                  description: `${phoneNumber} (${country}) - Monthly: $${monthlyPrice} + Setup: $${setupFee}`,
                },
                unit_amount: Math.round(totalCost * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/buy-number/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/buy-number`,
          metadata: {
            userId: user.id,
            phoneNumber,
            country,
            countryCode,
            city: city || "",
            type,
            monthlyPrice: monthlyPrice.toString(),
            setupFee: setupFee.toString(),
            capabilities: JSON.stringify(capabilities || { voice: true, sms: true, fax: false }),
            purchaseType: "phone_number"
          },
        });

        return NextResponse.json({
          success: true,
          paymentType: "checkout",
          sessionId: checkoutSession.id,
          checkoutUrl: checkoutSession.url,
          totalCost
        });

    } catch (stripeError) {
      console.error("Stripe checkout error:", stripeError);
      return NextResponse.json({ 
        error: "Failed to create payment session. Please try again." 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error purchasing phone number:", error);
    return NextResponse.json(
      { error: "Failed to purchase phone number" },
      { status: 500 }
    );
  }
}