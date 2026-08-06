import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/bookings/approve
 * Owner approves the tenant's payment and rental agreement.
 * - Property status: waiting_payment_approval → occupied
 * - Property listingStatus: active_marketplace → occupied (remove from public listing)
 * - User.propertyId is set → grants tenant full /dashboard-tenant access
 * - Booking is kept as record (no status change needed on booking model)
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    const { propertyId } = await request.json();
    if (!propertyId) return NextResponse.json({ error: "propertyId is required" }, { status: 400 });

    const property = await Property.findById(propertyId);
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.ownerId.toString() !== session.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (property.status !== "waiting_payment_approval")
      return NextResponse.json({ error: "Property is not awaiting payment approval" }, { status: 400 });

    const tenantId = property.tenantId;
    if (!tenantId) return NextResponse.json({ error: "No tenant linked to this property" }, { status: 400 });

    // Grant the tenant full dashboard access + promote role from pending to tenant
    await User.findByIdAndUpdate(tenantId, {
      propertyId: property._id,
      role: "tenant",
      isOnboarded: true,
    });

    // Mark property as occupied
    await Property.findByIdAndUpdate(propertyId, {
      status: "occupied",
      listingStatus: "occupied", // Remove from marketplace
      "agreement.isSignedByOwner": true,
      leaseStartDate: new Date(),
    });

    // Mark the booking as active — tenancy is live
    await Booking.findOneAndUpdate(
      { propertyId, tenantId },
      { status: "active" }
    );

    // Send final approval email to tenant
    const tenantUser = await User.findById(tenantId);
    if (tenantUser?.email) {
      const { sendTenantFinalApprovalEmail } = await import("@/lib/email");
      sendTenantFinalApprovalEmail(
        tenantUser.email,
        tenantUser.name || "Tenant",
        property.address
      ).catch((err) => console.error("Final approval email failed:", err));
    }

    return NextResponse.json({
      message: "Tenant approved and onboarded successfully. They now have full dashboard access.",
    }, { status: 200 });
  } catch (error: any) {
    console.error("BOOKING_APPROVE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
