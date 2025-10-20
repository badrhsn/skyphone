import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Volume discount tiers
const VOLUME_TIERS = [
  { minAmount: 0, maxAmount: 99, discount: 0, tier: 'Individual' },
  { minAmount: 100, maxAmount: 499, discount: 5, tier: 'Small Business' },
  { minAmount: 500, maxAmount: 1999, discount: 10, tier: 'Medium Business' },
  { minAmount: 2000, maxAmount: 4999, discount: 15, tier: 'Large Business' },
  { minAmount: 5000, maxAmount: 9999, discount: 20, tier: 'Enterprise' },
  { minAmount: 10000, maxAmount: Infinity, discount: 25, tier: 'Enterprise Plus' },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const amount = parseFloat(url.searchParams.get('amount') || '0');

    // Get user's historical spending for additional discounts
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        payments: {
          where: {
            status: 'COMPLETED',
            createdAt: {
              gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate total annual spending
    const annualSpending = user.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Determine volume tier based on current purchase
    const currentTier = VOLUME_TIERS.find(tier => 
      amount >= tier.minAmount && amount <= tier.maxAmount
    ) || VOLUME_TIERS[0];

    // Determine loyalty tier based on annual spending
    const loyaltyTier = VOLUME_TIERS.find(tier => 
      annualSpending >= tier.minAmount && annualSpending <= tier.maxAmount
    ) || VOLUME_TIERS[0];

    // Apply best discount (current purchase or loyalty)
    const bestDiscount = Math.max(currentTier.discount, loyaltyTier.discount);
    const discountAmount = (amount * bestDiscount) / 100;
    const finalAmount = amount - discountAmount;

    // Calculate bonus credits for volume purchases
    let bonusCredits = 0;
    if (amount >= 100) bonusCredits = amount * 0.05; // 5% bonus
    if (amount >= 500) bonusCredits = amount * 0.10; // 10% bonus
    if (amount >= 1000) bonusCredits = amount * 0.15; // 15% bonus
    if (amount >= 2000) bonusCredits = amount * 0.20; // 20% bonus

    return NextResponse.json({
      originalAmount: amount,
      discountPercent: bestDiscount,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      bonusCredits: bonusCredits,
      totalCredits: finalAmount + bonusCredits,
      currentTier: currentTier.tier,
      loyaltyTier: loyaltyTier.tier,
      annualSpending: annualSpending,
      availableTiers: VOLUME_TIERS,
      savings: discountAmount + bonusCredits,
    });

  } catch (error) {
    console.error("Volume discount API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, applyDiscount } = await request.json();

    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: "Minimum amount is $5" },
        { status: 400 }
      );
    }

    // Get discount calculation
    const discountResponse = await GET(request);
    const discountData = await discountResponse.json();

    if (!applyDiscount) {
      return NextResponse.json(discountData);
    }

    // Create payment with volume discount applied
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: discountData.finalAmount,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      ...discountData,
      message: `Volume discount of ${discountData.discountPercent}% applied! You save $${discountData.savings.toFixed(2)}`,
    });

  } catch (error) {
    console.error("Volume discount application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}