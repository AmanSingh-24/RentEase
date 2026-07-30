import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/bookings/reject
 * Owner rejects a pending booking request.
 * Property stays vacant so other tenants can still book.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    const { bookingId } = await request.json();
    if (!bookingId) return NextResponse.json({ error: "bookingId is required" }, { status: 400 });

    const booking = await Booking.findById(bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (booking.ownerId.toString() !== session.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    booking.status = "rejected";
    await booking.save();

    // If property was pending_payment (only one assigned tenant), revert to vacant
    const property = await Property.findById(booking.propertyId);
    if (property && property.status === "pending_payment") {
      await Property.findByIdAndUpdate(booking.propertyId, { status: "vacant" });
    }

    return NextResponse.json({ message: "Booking rejected." }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKING_REJECT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
