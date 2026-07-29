import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/applications/pre-approve
 *
 * Owner pre-approves a tenant's application and requests their Govt ID.
 * Sets application status from "submitted" → "kyc_requested".
 * The tenant will see a notification to upload their ID document.
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

    const application = await RentalApplication.findById(applicationId);
    if (!application)
      return NextResponse.json({ error: "Application not found" }, { status: 404 });

    // Ownership check — only the property's owner can pre-approve
    if (application.ownerId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized — not your property" }, { status: 403 });
    }

    // Can only pre-approve from "submitted" state
    if (application.status !== "submitted") {
      return NextResponse.json(
        { error: `Cannot pre-approve application in "${application.status}" status` },
        { status: 400 }
      );
    }

    await RentalApplication.findByIdAndUpdate(applicationId, {
      status: "kyc_requested",
    });

    return NextResponse.json(
      {
        message:
          "Application pre-approved! Tenant will be notified to upload their Government ID.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PRE_APPROVE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
