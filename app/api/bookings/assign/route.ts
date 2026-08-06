import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/bookings/assign
 * Owner assigns the property to a tenant.
 * - Booking status: pending → pending_payment
 * - Property status: vacant → pending_payment
 * - All other pending bookings for the same property are rejected.
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
    if (booking.status !== "pending")
      return NextResponse.json({ error: "Booking is no longer in pending state" }, { status: 400 });

    // Assign this booking
    booking.status = "pending_payment";
    await booking.save();

    // Link tenantId to property so property knows who is assigned, but status is pending_payment
    await Property.findByIdAndUpdate(booking.propertyId, {
      status: "pending_payment",
      tenantId: booking.tenantId,
    });

    // Fetch property address and tenant user details for email notification
    const User = (await import("@/models/User")).default;
    const [property, tenantUser] = await Promise.all([
      Property.findById(booking.propertyId),
      User.findById(booking.tenantId),
    ]);

    // Send email to tenant
    if (tenantUser?.email) {
      const { sendTenantPropertyAssignedEmail } = await import("@/lib/email");
      sendTenantPropertyAssignedEmail(
        tenantUser.email,
        tenantUser.name || booking.tenantContact?.name || "Tenant",
        property?.address || "your requested property"
      ).catch((err) => console.error("Email send failed:", err));
    }

    // Reject all other pending bookings for the same property & send rejection emails
    const otherBookings = await Booking.find({
      propertyId: booking.propertyId,
      status: "pending",
      _id: { $ne: booking._id },
    });

    await Booking.updateMany(
      { propertyId: booking.propertyId, status: "pending", _id: { $ne: booking._id } },
      { status: "rejected" }
    );

    // Send rejection email to each rejected applicant
    if (otherBookings.length > 0) {
      const { sendTenantBookingRejectedEmail } = await import("@/lib/email");
      for (const b of otherBookings) {
        const otherTenant = await User.findById(b.tenantId);
        if (otherTenant?.email) {
          sendTenantBookingRejectedEmail(
            otherTenant.email,
            otherTenant.name || b.tenantContact?.name || "Applicant",
            property?.address || "the property"
          ).catch((err) => console.error("Rejection email failed:", err));
        }
      }
    }

    return NextResponse.json({ message: "Property assigned. Tenant has been notified to proceed with payment." }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKING_ASSIGN_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
