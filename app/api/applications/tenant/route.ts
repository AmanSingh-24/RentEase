import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/applications/tenant
 *
 * Returns all applications submitted by the currently logged-in tenant.
 * Includes property info and current status so tenant can track progress.
 * Owner contact info (phone, email) is NOT returned.
 *
 * Auth: tenant only
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "tenant")
      return NextResponse.json({ error: "Tenant access required" }, { status: 403 });

    const applications = await RentalApplication.find({ tenantId: session.id })
      .populate("propertyId", "address city bhk rentAmount depositAmount listingImages furnishing")
      .populate("ownerId", "name") // Only name — ZERO contact info
      .sort({ createdAt: -1 });

    return NextResponse.json({ applications }, { status: 200 });
  } catch (error: any) {
    console.error("TENANT_APPLICATIONS_GET_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
