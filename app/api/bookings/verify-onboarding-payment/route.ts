import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import Payment from "@/models/Payment";
import User from "@/models/User";
import crypto from "crypto";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/bookings/verify-onboarding-payment
 *
 * Called after Razorpay checkout completes on the onboarding-payment page.
 * Verifies the signature, creates 2 Payment records (deposit + first month rent),
 * and moves the property to waiting_payment_approval so the owner can review.
 *
 * Body: { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    // ── 1. Verify Razorpay signature ────────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // ── 2. Fetch booking and property ────────────────────────────────────────
    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.tenantId.toString() !== session.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (booking.status !== "pending_payment")
      return NextResponse.json({ error: "Booking is not in pending_payment state" }, { status: 400 });

    const property = await Property.findById(booking.propertyId);
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    // Use today's date to label the first payment month/year
    const now = new Date();
    const startMonth = now.toLocaleString("default", { month: "long" });
    const startYear = now.getFullYear();

    // ── 3. Create DEPOSIT payment record ────────────────────────────────────
    await Payment.create({
      propertyId: property._id,
      tenantId: session.id,
      type: "deposit",
      month: startMonth,
      year: startYear,
      baseRent: property.depositAmount,
      penaltyApplied: 0,
      maintenanceCredit: 0,
      totalAmountPaid: property.depositAmount,
      gatewayTransactionId: razorpay_payment_id,
      status: "completed",
    });

    // ── 4. Create first month RENT payment record ────────────────────────────
    await Payment.create({
      propertyId: property._id,
      tenantId: session.id,
      type: "rent",
      month: startMonth,
      year: startYear,
      baseRent: property.rentAmount,
      penaltyApplied: 0,
      maintenanceCredit: 0,
      totalAmountPaid: property.rentAmount,
      gatewayTransactionId: razorpay_payment_id,
      status: "completed",
    });

    // ── 5. Tenant is now linked to property for owner lookup ─────────────────
    // NOTE: Property status stays "pending_payment" here.
    // It only moves to "waiting_payment_approval" after the tenant
    // also signs the rental agreement on the next step.
    await Property.findByIdAndUpdate(property._id, {
      tenantId: session.id, // link tenant so owner can populate their name
    });

    return NextResponse.json({
      message: "Payment verified. Proceed to sign the rental agreement.",
    }, { status: 200 });
  } catch (error: any) {
    console.error("VERIFY_ONBOARDING_PAYMENT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
