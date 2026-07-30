import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/bookings/submit-payment
 * Tenant confirms payment and submits their rental agreement signature.
 * - Property status: pending_payment → waiting_payment_approval
 * - Stores digital signature on the property agreement field
 * - Links tenant to the property
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId, signatureData } = await request.json();
    if (!bookingId || !signatureData)
      return NextResponse.json({ error: "bookingId and signatureData are required" }, { status: 400 });

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.tenantId.toString() !== session.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (booking.status !== "pending_payment")
      return NextResponse.json({ error: "Booking is not in pending_payment state" }, { status: 400 });

    // Update property: store signature, change status to waiting_payment_approval
    await Property.findByIdAndUpdate(booking.propertyId, {
      status: "waiting_payment_approval",
      "agreement.isSignedByTenant": true,
      "agreement.signedAt": new Date(),
      "agreement.blockchainHash": signatureData, // stores the canvas signature data URI
      tenantId: session.id, // link tenant to property for owner lookup
    });

    return NextResponse.json({
      message: "Payment confirmed and agreement signed. Waiting for owner to verify.",
    }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKING_SUBMIT_PAYMENT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
