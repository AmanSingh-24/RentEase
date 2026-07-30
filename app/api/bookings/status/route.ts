import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/bookings/status?propertyId=...
 * Tenant checks if they have an existing booking for a property.
 * Returns the booking status so the UI can show "Book" vs "Requested".
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ booking: null }, { status: 200 });

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) return NextResponse.json({ booking: null }, { status: 200 });

    const booking = await Booking.findOne({
      tenantId: session.id,
      propertyId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ booking }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKING_STATUS_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
