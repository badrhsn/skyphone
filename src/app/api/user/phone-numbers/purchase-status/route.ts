import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve the Stripe session to get metadata
    const stripe = await getStripe();
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (stripeSession.customer_email !== session.user.email) {
      return NextResponse.json({ error: "Session does not belong to user" }, { status: 403 });
    }

    // Check if this was a phone number purchase
    if (stripeSession.metadata?.purchaseType === "phone_number") {
        const phoneNumber = stripeSession.metadata.phoneNumber;
        
        // Find the purchased phone number in the database
        const purchasedNumber = await prisma.phoneNumber.findFirst({
          where: {
            userId: user.id,
            phoneNumber: phoneNumber
          },
          orderBy: {
            purchaseDate: 'desc'
          }
        });

        if (purchasedNumber) {
          return NextResponse.json({
            success: true,
            purchaseType: "phone_number",
            phoneNumber: {
              id: purchasedNumber.id,
              phoneNumber: purchasedNumber.phoneNumber,
              country: purchasedNumber.country,
              countryCode: purchasedNumber.countryCode,
              city: purchasedNumber.city,
              type: purchasedNumber.type,
              monthlyPrice: purchasedNumber.monthlyPrice,
              setupFee: purchasedNumber.setupFee,
              isActive: purchasedNumber.isActive,
              capabilities: JSON.parse(purchasedNumber.capabilities || '{}'),
              purchaseDate: purchasedNumber.purchaseDate,
              nextBilling: purchasedNumber.nextBilling,
            },
            totalPaid: (purchasedNumber.monthlyPrice || 0) + (purchasedNumber.setupFee || 0),
            paymentStatus: stripeSession.payment_status
          });
        } else {
          // Phone number not found in database - might still be processing
          return NextResponse.json({
            success: false,
            processing: true,
            message: "Purchase is being processed. Please check back in a few moments.",
            metadata: {
              phoneNumber: stripeSession.metadata.phoneNumber,
              country: stripeSession.metadata.country,
              monthlyPrice: parseFloat(stripeSession.metadata.monthlyPrice || "0"),
              setupFee: parseFloat(stripeSession.metadata.setupFee || "0"),
            }
          });
        }
      } else {
        return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 });
      }

  } catch (error) {
    console.error("Error fetching purchase status:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase status" },
      { status: 500 }
    );
  }
}