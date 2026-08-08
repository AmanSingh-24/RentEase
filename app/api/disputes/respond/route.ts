import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";
import Dispute from "@/models/Dispute";

// POST /api/disputes/respond
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { disputeId, description, evidenceUrls } = body;

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Verify respondent
    if (dispute.respondentId.toString() !== session.id) {
      return NextResponse.json({ error: "Only the respondent can counter-claim this dispute." }, { status: 403 });
    }

    dispute.respondentClaim = {
      description,
      evidenceUrls: evidenceUrls || [],
      submittedAt: new Date()
    };
    
    dispute.status = "under_review_by_admin";

    await dispute.save();

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("Respond Dispute Error:", error);
    return NextResponse.json({ error: "Failed to respond to dispute" }, { status: 500 });
  }
}
