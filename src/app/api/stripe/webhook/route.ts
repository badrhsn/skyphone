import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getStripeConfig } from "@/lib/config-helper";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    const stripe = await getStripe();
    const config = await getStripeConfig();
    
    if (!config?.webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const purchaseType = session.metadata?.purchaseType;

        if (purchaseType === "phone_number") {
          // Handle phone number purchase
          const phoneNumber = session.metadata?.phoneNumber;
          const country = session.metadata?.country;
          const countryCode = session.metadata?.countryCode;
          const city = session.metadata?.city;
          const type = session.metadata?.type;
          const monthlyPrice = parseFloat(session.metadata?.monthlyPrice || "0");
          const setupFee = parseFloat(session.metadata?.setupFee || "0");
          const capabilities = session.metadata?.capabilities;

          if (userId && phoneNumber && monthlyPrice > 0) {
            try {
              // Import here to avoid circular dependencies
              const { purchasePhoneNumber } = await import("@/lib/twilio");
              
              // Purchase the number from Twilio
              const twilioNumber = await purchasePhoneNumber(phoneNumber, `${userId} - ${phoneNumber}`);

              // Use transaction to ensure data consistency
              await prisma.$transaction(async (tx) => {
                // Create phone number record in database
                await tx.phoneNumber.create({
                  data: {
                    userId,
                    phoneNumber,
                    country: country || "United States",
                    countryCode: countryCode || "+1",
                    city: city || "",
                    type: type === "toll-free" ? "TOLL_FREE" : "LOCAL",
                    monthlyPrice,
                    setupFee,
                    twilioSid: twilioNumber.sid,
                    capabilities: capabilities || JSON.stringify({ voice: true, sms: true, fax: false }),
                    nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    isActive: true, // Mark as active immediately
                  },
                });

                // Create payment record
                await tx.payment.create({
                  data: {
                    userId,
                    amount: monthlyPrice + setupFee,
                    currency: "USD",
                    status: "COMPLETED",
                    stripePaymentId: session.payment_intent as string,
                    stripeSessionId: session.id,
                  },
                });
              });

              console.log(`Phone number ${phoneNumber} successfully purchased for user ${userId}`);

            } catch (twilioError) {
              console.error("Failed to purchase phone number from Twilio:", twilioError);
              
              // Create a payment record but mark the phone number as failed
              try {
                await prisma.$transaction(async (tx) => {
                  // Create phone number record but mark as inactive due to Twilio failure
                  await tx.phoneNumber.create({
                    data: {
                      userId,
                      phoneNumber,
                      country: country || "United States",
                      countryCode: countryCode || "+1",
                      city: city || "",
                      type: type === "toll-free" ? "TOLL_FREE" : "LOCAL",
                      monthlyPrice,
                      setupFee,
                      twilioSid: null, // No Twilio SID since purchase failed
                      capabilities: capabilities || JSON.stringify({ voice: true, sms: true, fax: false }),
                      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                      isActive: false, // Mark as inactive due to failure
                    },
                  });

                  // Still create payment record since customer was charged
                  await tx.payment.create({
                    data: {
                      userId,
                      amount: monthlyPrice + setupFee,
                      currency: "USD",
                      status: "COMPLETED", // Payment completed but service failed
                      stripePaymentId: session.payment_intent as string,
                      stripeSessionId: session.id,
                    },
                  });
                });
              } catch (dbError) {
                console.error("Failed to create failure record:", dbError);
              }
              
              // TODO: Implement automatic refund logic here
            }
          }
        } else {
          // Handle regular credit purchase
          const amount = parseFloat(session.metadata?.amount || "0");
          const autoTopup = session.metadata?.autoTopup === "true";
          const autoTopupThreshold = parseFloat(session.metadata?.autoTopupThreshold || "0") || null;
          const autoTopupAmount = parseFloat(session.metadata?.autoTopupAmount || "0") || null;
          const invoiceRequired = session.metadata?.invoiceRequired === "true";
          const promoCode = session.metadata?.promoCode || null;

          if (userId && amount > 0) {
            // Update user balance
            await prisma.user.update({
              where: { id: userId },
              data: {
                balance: {
                  increment: amount,
                },
              },
            });

            // Update auto-topup settings if requested
            if (autoTopup) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  autoTopupEnabled: true,
                  autoTopupThreshold: autoTopupThreshold || undefined,
                  autoTopupAmount: autoTopupAmount || undefined,
                },
              });
            }

            // Create payment record
            await prisma.payment.create({
              data: {
                userId,
                amount,
                currency: "USD",
                status: "COMPLETED",
                stripePaymentId: session.payment_intent as string,
                stripeSessionId: session.id,
              },
            });
          }
        }
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
