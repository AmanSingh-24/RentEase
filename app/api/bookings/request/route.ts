import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/bookings/request
 * Tenant submits a booking request for a property.
 * Body: { propertyId, name, phone, email }
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "tenant" && session.role !== "pending")
      return NextResponse.json({ error: "Only tenants can book properties" }, { status: 403 });

    const { propertyId, name, phone, email } = await request.json();
    if (!propertyId || !name || !phone || !email)
      return NextResponse.json({ error: "propertyId, name, phone and email are required" }, { status: 400 });

    const property = await Property.findById(propertyId);
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.listingStatus !== "active_marketplace")
      return NextResponse.json({ error: "This property is no longer available" }, { status: 400 });
    if (property.status !== "vacant")
      return NextResponse.json({ error: "This property is no longer available for booking" }, { status: 400 });

    // Prevent duplicate active bookings from same tenant on same property
    const existing = await Booking.findOne({
      tenantId: session.id,
      propertyId,
      status: { $in: ["pending", "pending_payment"] },
    });
    if (existing)
      return NextResponse.json({ error: "You already have an active booking for this property" }, { status: 409 });

    const booking = await Booking.create({
      propertyId,
      tenantId: session.id,
      ownerId: property.ownerId,
      tenantContact: { name, phone, email },
      status: "pending",
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error("BOOKING_REQUEST_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
