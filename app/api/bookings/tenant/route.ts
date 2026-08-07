import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/bookings/tenant
 * Tenant fetches their active booking (if any) with full property details.
 * Used by the Navbar and the /dashboard/onboarding-* pages to determine routing.
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ booking: null }, { status: 200 });

    // Find the most recent non-rejected booking
    const booking = await Booking.findOne({
      tenantId: session.id,
      status: { $ne: "rejected" },
    })
      .populate(
        "propertyId",
        "address city bhk rentAmount depositAmount listingImages status agreement ownerId structure maintenanceRules exitPolicy leaseStartDate"
      )
      .sort({ createdAt: -1 });

    return NextResponse.json({ booking }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKING_TENANT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
