import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import RentalApplication from "@/models/RentalApplication";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/admin/pending-approvals
 *
 * Returns all data the admin needs across three tabs:
 *   1. Pending landlord KYC queue (verificationStatus = "pending_verification")
 *   2. Pending property deed queue (listingStatus = "pending_approval")
 *   3. Global oversight — all users + all marketplace properties
 *
 * Auth: admin only
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    // ── Tab 1: Pending Landlord KYC Queue ────────────────────────────────────
    const pendingLandlords = await User.find({
      role: "owner",
      verificationStatus: "pending_verification",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    // ── Tab 2: Pending Property Deed Queue ───────────────────────────────────
    const pendingProperties = await Property.find({
      listingStatus: "pending_approval",
    })
      .populate("ownerId", "name email verificationStatus kycDetails")
      .sort({ createdAt: -1 });

    // ── Tab 3: Global Oversight ──────────────────────────────────────────────
    // All users (most recent 200)
    const allUsers = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(200);

    // All marketplace-related properties
    const allListings = await Property.find({
      listingStatus: {
        $in: ["active_marketplace", "pending_approval", "rejected", "unlisted", "occupied"],
      },
    })
      .populate("ownerId", "name email verificationStatus")
      .sort({ createdAt: -1 })
      .limit(200);

    // Recent applications (for oversight)
    const recentApplications = await RentalApplication.find({})
      .populate("tenantId", "name email")
      .populate("propertyId", "address city")
      .populate("ownerId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(
      {
        pendingLandlords,
        pendingProperties,
        allUsers,
        allListings,
        recentApplications,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("ADMIN_PENDING_APPROVALS_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
