import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/bookings/owner
 * Owner fetches all booking requests for their properties.
 * Returns pending bookings grouped with property and tenant contact info.
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    const bookings = await Booking.find({
      ownerId: session.id,
      status: { $in: ["pending", "pending_payment"] },
    })
      .populate("propertyId", "address city bhk rentAmount depositAmount listingImages status listingStatus")
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKINGS_OWNER_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
