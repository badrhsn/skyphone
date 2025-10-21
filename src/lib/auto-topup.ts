import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

interface AutoTopupResult {
  success: boolean;
  message: string;
  newBalance?: number;
  amountAdded?: number;
}

export async function checkAndTriggerAutoTopup(userId: string): Promise<AutoTopupResult> {
  try {
    // Get user's current balance and auto top-up settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Cast to access the new fields (temporary fix for TypeScript)
    const userWithAutoTopup = user as any;

    // Check if auto top-up is enabled and balance is below threshold
    if (!userWithAutoTopup.autoTopupEnabled) {
      return { success: false, message: "Auto top-up is disabled" };
    }

    if (user.balance >= userWithAutoTopup.autoTopupThreshold) {
      return { success: false, message: "Balance is above threshold" };
    }

    const topupAmount = userWithAutoTopup.autoTopupAmount || 10.0;

    // Create Stripe payment intent for auto top-up
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(topupAmount * 100), // Convert to cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        type: "auto_topup",
        amount: topupAmount.toString(),
      },
      description: `Auto top-up for ${user.email}`,
    });

    // For demo purposes, we'll simulate a successful payment
    // In production, you'd integrate with saved payment methods
    const simulatePaymentSuccess = true;

    if (simulatePaymentSuccess) {
      // Update user balance
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: topupAmount,
          },
        },
        select: {
          balance: true,
        },
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          userId: userId,
          amount: topupAmount,
          currency: "USD",
          status: "COMPLETED",
          stripePaymentId: paymentIntent.id,
        },
      });

      // TODO: Send email notification to user about auto top-up
      console.log(`Auto top-up successful for user ${user.email}: $${topupAmount} added`);

      return {
        success: true,
        message: "Auto top-up completed successfully",
        newBalance: updatedUser.balance,
        amountAdded: topupAmount,
      };
    } else {
      // Payment failed
      return {
        success: false,
        message: "Auto top-up payment failed",
      };
    }
  } catch (error) {
    console.error("Error in auto top-up:", error);
    return {
      success: false,
      message: "Auto top-up failed due to system error",
    };
  }
}

export async function checkBalanceBeforeCall(userId: string, estimatedCost: number = 0.5): Promise<{ canProceed: boolean; newBalance?: number }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { canProceed: false };
    }

    // Check if user has enough balance for the call
    if (user.balance >= estimatedCost) {
      return { canProceed: true };
    }

    // If not enough balance, try auto top-up
    const autoTopupResult = await checkAndTriggerAutoTopup(userId);
    
    if (autoTopupResult.success && autoTopupResult.newBalance) {
      // Check if balance is now sufficient after auto top-up
      if (autoTopupResult.newBalance >= estimatedCost) {
        return { 
          canProceed: true, 
          newBalance: autoTopupResult.newBalance 
        };
      }
    }

    return { canProceed: false };
  } catch (error) {
    console.error("Error checking balance before call:", error);
    return { canProceed: false };
  }
}

export async function processPaymentWithAutoTopup(userId: string, amount: number): Promise<{ success: boolean; newBalance?: number; autoTopupTriggered?: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false };
    }

    // Check if balance will be below threshold after this payment
    const balanceAfterPayment = user.balance - amount;
    const userWithAutoTopup = user as any;
    
    let autoTopupTriggered = false;
    let finalBalance = balanceAfterPayment;

    // Process the payment first
    if (user.balance >= amount) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Check if auto top-up should be triggered after payment
      if (userWithAutoTopup.autoTopupEnabled && balanceAfterPayment < userWithAutoTopup.autoTopupThreshold) {
        const autoTopupResult = await checkAndTriggerAutoTopup(userId);
        if (autoTopupResult.success) {
          autoTopupTriggered = true;
          finalBalance = autoTopupResult.newBalance || balanceAfterPayment;
        }
      }

      return {
        success: true,
        newBalance: finalBalance,
        autoTopupTriggered,
      };
    } else {
      // Insufficient funds, try auto top-up first
      const autoTopupResult = await checkAndTriggerAutoTopup(userId);
      
      if (autoTopupResult.success && autoTopupResult.newBalance && autoTopupResult.newBalance >= amount) {
        // Now we have enough balance, process the payment
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              decrement: amount,
            },
          },
          select: {
            balance: true,
          },
        });

        return {
          success: true,
          newBalance: updatedUser.balance,
          autoTopupTriggered: true,
        };
      } else {
        return { success: false };
      }
    }
  } catch (error) {
    console.error("Error processing payment with auto top-up:", error);
    return { success: false };
  }
}