import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/bookings/pending-approval
 * Owner fetches properties where tenants have paid + signed and are waiting for final approval.
 * These are properties with status === "waiting_payment_approval".
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    // Find properties owned by this user that are awaiting payment verification
    const properties = await Property.find({
      ownerId: session.id,
      status: "waiting_payment_approval",
    }).populate("tenantId", "name email");

    // Also get the booking to retrieve payment details
    const result = await Promise.all(
      properties.map(async (prop) => {
        const booking = await Booking.findOne({
          propertyId: prop._id,
          status: "pending_payment",
        });
        return { property: prop, booking };
      })
    );

    return NextResponse.json({ items: result }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKINGS_PENDING_APPROVAL_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
