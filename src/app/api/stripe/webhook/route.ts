import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
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
              const twilioNumber = await purchasePhoneNumber(phoneNumber);

              // Create phone number record in database
              await prisma.phoneNumber.create({
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
                },
              });

              // Create payment record
              await prisma.payment.create({
                data: {
                  userId,
                  amount: monthlyPrice + setupFee,
                  currency: "USD",
                  status: "COMPLETED",
                  stripePaymentId: session.payment_intent as string,
                  stripeSessionId: session.id,
                },
              });

            } catch (twilioError) {
              console.error("Failed to purchase phone number from Twilio:", twilioError);
              // Could implement refund logic here
            }
          }
        } else {
          // Handle regular credit purchase
          const amount = parseFloat(session.metadata?.amount || "0");

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
