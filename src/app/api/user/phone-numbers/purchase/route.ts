import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { purchasePhoneNumber } from "@/lib/twilio";
import { stripe } from "@/lib/stripe";

const prisma = new PrismaClient();

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

    // Check payment method preference
    if (paymentMethod === "balance" || (!paymentMethod && user.balance >= totalCost)) {
      // User has sufficient balance - proceed with direct purchase
      if (user.balance < totalCost) {
        return NextResponse.json({ 
          error: "Insufficient balance",
          required: totalCost,
          current: user.balance,
          redirectToCheckout: true
        }, { status: 400 });
      }

      try {
        // Purchase the number from Twilio
        const twilioNumber = await purchasePhoneNumber(phoneNumber, `${user.name || user.email} - ${phoneNumber}`);

        // Start transaction to purchase number and deduct balance
        const result = await prisma.$transaction(async (tx) => {
          // Create phone number record
          const newPhoneNumber = await tx.phoneNumber.create({
            data: {
              userId: user.id,
              phoneNumber,
              country,
              countryCode,
              city,
              type: type === "toll-free" ? "TOLL_FREE" : "LOCAL",
              monthlyPrice,
              setupFee,
              twilioSid: twilioNumber.sid,
              capabilities: JSON.stringify(capabilities || { voice: true, sms: true, fax: false }),
              nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
          });

          // Deduct balance from user
          await tx.user.update({
            where: { id: user.id },
            data: {
              balance: {
                decrement: totalCost
              }
            }
          });

          // Create payment record
          await tx.payment.create({
            data: {
              userId: user.id,
              amount: -totalCost, // Negative amount for purchase
              currency: "USD",
              status: "COMPLETED",
              stripePaymentId: `phone_purchase_${newPhoneNumber.id}`,
            }
          });

          return newPhoneNumber;
        });

        return NextResponse.json({
          success: true,
          method: "balance",
          phoneNumber: {
            id: result.id,
            phoneNumber: result.phoneNumber,
            country: result.country,
            countryCode: result.countryCode,
            city: result.city,
            type: result.type,
            monthlyPrice: result.monthlyPrice,
            setupFee: result.setupFee,
            isActive: result.isActive,
            capabilities: JSON.parse(result.capabilities),
            purchaseDate: result.purchaseDate,
            nextBilling: result.nextBilling,
            twilioSid: result.twilioSid,
          },
          newBalance: user.balance - totalCost
        });

      } catch (twilioError) {
        console.error("Twilio purchase error:", twilioError);
        return NextResponse.json({ 
          error: "Failed to purchase number from provider. Please try again." 
        }, { status: 500 });
      }

    } else {
      // User wants to pay directly or has insufficient balance - create Stripe checkout
      try {
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
          method: "checkout",
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
    }

  } catch (error) {
    console.error("Error purchasing phone number:", error);
    return NextResponse.json(
      { error: "Failed to purchase phone number" },
      { status: 500 }
    );
  }
}