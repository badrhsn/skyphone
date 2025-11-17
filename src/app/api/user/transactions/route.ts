import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Transaction type for tracking balance changes
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const limit = request.nextUrl.searchParams.get("limit") || "100";
    const type = request.nextUrl.searchParams.get("type"); // 'call', 'topup', 'refund'

    // Get all calls to build transaction history
    const calls = await prisma.call.findMany({
      where: { userId },
      orderBy: { endedAt: "desc" },
      take: parseInt(limit),
    });

    // Get all payments to include in transaction history
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    // Build transaction list from calls and payments
    const transactions = [
      // Calls are debits
      ...calls.map((call) => ({
        id: `call_${call.id}`,
        type: "call" as const,
        amount: -call.cost, // negative for debit
        description: `Call to ${call.toNumber} in ${call.country} (${call.duration}s)`,
        callId: call.id,
        paymentId: null,
        status: call.status.toLowerCase(),
        timestamp: call.endedAt || call.createdAt,
        details: {
          toNumber: call.toNumber,
          fromNumber: call.fromNumber,
          country: call.country,
          duration: call.duration,
          cost: call.cost,
          status: call.status,
        },
      })),
      // Payments are credits
      ...payments.map((payment) => ({
        id: `payment_${payment.id}`,
        type: "topup" as const,
        amount: payment.amount, // positive for credit
        description: `Credit topup via ${payment.status.toLowerCase()}`,
        callId: null,
        paymentId: payment.id,
        status: payment.status.toLowerCase(),
        timestamp: payment.createdAt,
        details: {
          currency: payment.currency,
          stripePaymentId: payment.stripePaymentId,
          stripeSessionId: payment.stripeSessionId,
        },
      })),
    ];

    // Filter by type if specified
    let filtered = transactions;
    if (type) {
      filtered = transactions.filter((t) => t.type === type);
    }

    // Sort by timestamp descending
    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      count: filtered.length,
      transactions: filtered.slice(0, parseInt(limit)),
      summary: {
        totalDebits: filtered
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + t.amount, 0),
        totalCredits: filtered
          .filter((t) => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0),
        netChange: filtered.reduce((sum, t) => sum + t.amount, 0),
      },
    });
  } catch (error) {
    console.error("❌ [Transactions API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create transaction record
 * Can be called by webhooks or admin functions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount, description, callId, reason } = body;

    if (!type || typeof amount !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: type, amount" },
        { status: 400 }
      );
    }

    // Create transaction record in call metadata if it's a call-related transaction
    if (callId && type === "call") {
      const call = await prisma.call.findUnique({
        where: { id: callId },
      });

      if (!call) {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }

      // Update call metadata with transaction info
      const metadata = JSON.parse(call.metadata || "{}");
      metadata.transaction = {
        type,
        amount,
        description,
        reason,
        recordedAt: new Date().toISOString(),
      };

      await prisma.call.update({
        where: { id: callId },
        data: {
          metadata: JSON.stringify(metadata),
        },
      });
    }

    return NextResponse.json({
      success: true,
      transaction: {
        type,
        amount,
        description,
        reason,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("❌ [Transactions POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
