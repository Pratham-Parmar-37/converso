import { NextResponse } from "next/server";

import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { amount } = await request.json();
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid amount." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayInstance();

    // Razorpay expects the amount in paise, so we convert rupees to the smallest unit.
    const order = await razorpay.orders.create({
      amount: Math.round(parsedAmount * 100),
      currency: "INR",
      receipt: `converso_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      keyId: getRazorpayKeyId(),
      order,
    });
  } catch (error) {
    console.error("Failed to create Razorpay order:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create Razorpay order." },
      { status: 500 }
    );
  }
}
