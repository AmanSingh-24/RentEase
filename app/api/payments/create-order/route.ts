import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// ⚠️ DO NOT instantiate Razorpay at module level in Next.js App Router —
// env vars are not available during the module evaluation phase on cold starts.
// Always instantiate inside the request handler.

export async function POST(request: Request) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const { amount, currency = "INR", receiptId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Rupees → Paise
      currency,
      receipt: receiptId,
    });

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("RAZORPAY_ORDER_ERROR:", error);
    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}