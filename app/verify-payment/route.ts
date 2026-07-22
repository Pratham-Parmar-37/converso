import crypto from "crypto";
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { getRazorpayKeySecret } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      billingCycle,
      amount,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    if (!planId || !billingCycle) {
      return NextResponse.json(
        { success: false, message: "Missing subscription details." },
        { status: 400 }
      );
    }

    // Razorpay signs "order_id|payment_id" with the test secret.
    const expectedSignature = crypto
      .createHmac("sha256", getRazorpayKeySecret())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature.length !== razorpay_signature.length) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed." },
        { status: 400 }
      );
    }

    const isValidSignature = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed." },
        { status: 400 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "You must be signed in to activate a plan." },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionPlan: planId,
        subscriptionBillingCycle: billingCycle,
        subscriptionStatus: "active",
        subscriptionAmount: Number(amount) || null,
        subscriptionActivatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Failed to verify Razorpay payment:", error);

    return NextResponse.json(
      { success: false, message: "Unable to verify payment." },
      { status: 500 }
    );
  }
}
