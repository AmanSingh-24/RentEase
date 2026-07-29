import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";
import { logActivity } from "@/lib/logActivity";

/**
 * POST /api/applications/finalize
 *
 * Owner finalizes the lease after reviewing the tenant's KYC document.
 * This is the critical step that:
 *   1. Updates RentalApplication.status → "approved"
 *   2. Links tenantId to the Property
 *   3. Sets Property.status → "occupied" (internal tenancy state)
 *   4. Sets Property.listingStatus → "occupied" (AUTO-DELISTS from marketplace)
 *   5. Sets User.propertyId for the tenant (grants tenancy dashboard access)
 *   6. Rejects all other pending applications for this property (double-booking shield)
 *   7. Logs an activity notification for the tenant
 *
 * Auth: owner only
 * Body: { applicationId }
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    const { applicationId } = await request.json();
    if (!applicationId)
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });

    // ── Load Application ─────────────────────────────────────────────────────
    const application = await RentalApplication.findById(applicationId);
    if (!application)
      return NextResponse.json({ error: "Application not found" }, { status: 404 });

    // Ownership check
    if (application.ownerId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized — not your property" }, { status: 403 });
    }

    // ── State Guard ───────────────────────────────────────────────────────────
    if (application.status !== "pre_approved") {
      return NextResponse.json(
        {
          error: `Cannot finalize. Tenant must upload their Govt ID first. Current status: "${application.status}"`,
        },
        { status: 400 }
      );
    }

    const tenantId = application.tenantId;
    const propertyId = application.propertyId;

    // ── Step 1: Approve This Application ─────────────────────────────────────
    await RentalApplication.findByIdAndUpdate(applicationId, {
      status: "approved",
    });

    // ── Step 2: Link Tenant to Property & Set Lease Start ────────────────────
    await Property.findByIdAndUpdate(propertyId, {
      tenantId: tenantId,
      status: "occupied",
      listingStatus: "occupied", // ← DOUBLE-BOOKING SHIELD: Auto-delists from marketplace
      leaseStartDate: new Date(),
    });

    // ── Step 3: Grant Tenant Access to Tenancy Dashboard ─────────────────────
    await User.findByIdAndUpdate(tenantId, {
      propertyId: propertyId,
      isOnboarded: false, // Will become true after they complete deposit payment
    });

    // ── Step 4: Auto-Reject All Other Applications for This Property ──────────
    await RentalApplication.updateMany(
      {
        propertyId,
        _id: { $ne: applicationId },
        status: { $nin: ["rejected", "withdrawn"] },
      },
      {
        status: "rejected",
        rejectionReason:
          "The landlord has selected another applicant for this property. Thank you for your interest.",
      }
    );

    // ── Step 5: Notify Tenant via Activity Feed ───────────────────────────────
    try {
      await logActivity({
        propertyId,
        recipientId: tenantId,
        senderId: session.id,
        title: "🎉 Lease Approved! Welcome Home",
        desc: "Your rental application has been approved by the landlord. You now have full access to your tenancy dashboard — complete your payment to activate all features.",
        category: "legal",
      });
    } catch (logErr) {
      // Non-fatal — don't fail the finalize if activity log fails
      console.warn("Activity log failed after finalize:", logErr);
    }

    return NextResponse.json(
      {
        message:
          "Lease finalized! The tenant has been linked to the property and all other applications have been closed.",
        propertyId,
        tenantId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("FINALIZE_LEASE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
