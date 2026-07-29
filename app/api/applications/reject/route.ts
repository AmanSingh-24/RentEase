import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/applications/reject
 *
 * Owner rejects a rental application.
 * Sets status to "rejected" with an optional reason.
 *
 * Auth: owner only
 * Body: { applicationId, reason? }
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner")
      return NextResponse.json({ error: "Owner access required" }, { status: 403 });

    const { applicationId, reason } = await request.json();
    if (!applicationId)
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 });

    const application = await RentalApplication.findById(applicationId);
    if (!application)
      return NextResponse.json({ error: "Application not found" }, { status: 404 });

    if (application.ownerId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized — not your property" }, { status: 403 });
    }

    if (["approved", "rejected", "withdrawn"].includes(application.status)) {
      return NextResponse.json(
        { error: `Application is already in "${application.status}" state` },
        { status: 400 }
      );
    }

    await RentalApplication.findByIdAndUpdate(applicationId, {
      status: "rejected",
      rejectionReason: reason || "Thank you for your interest. We have selected another applicant.",
    });

    return NextResponse.json({ message: "Application rejected." }, { status: 200 });
  } catch (error: any) {
    console.error("REJECT_APPLICATION_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
