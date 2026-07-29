import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/applications/owner
 *
 * Returns all rental applications for properties owned by the current user.
 * Includes applicant details and tenant basic info.
 * Does NOT expose tenant KYC document URL — that's only viewable in the UI after pre-approval.
 *
 * Auth: owner only
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    const applications = await RentalApplication.find({ ownerId: session.id })
      .populate("tenantId", "name email") // Only name + email — no KYC details from User
      .populate("propertyId", "address city bhk rentAmount listingImages listingStatus")
      .sort({ createdAt: -1 });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error: any) {
    console.error("OWNER_APPLICATIONS_GET_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
