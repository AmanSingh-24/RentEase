import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";
import Dispute from "@/models/Dispute";
import Payment from "@/models/Payment";

// POST /api/disputes/resolve
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    // Only Admin can resolve
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
    }

    const body = await request.json();
    const { disputeId, decisionNotes, winner } = body;

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    dispute.status = "resolved";
    dispute.adminResolution = {
      resolvedByAdminId: session.id,
      decisionNotes,
      resolvedAt: new Date(),
      winner
    };

    await dispute.save();

    // If it was linked to a Payment, unfreeze it
    if (dispute.relatedEntityModel === "Payment" && dispute.relatedEntityId) {
      // In a robust system, this would alter the payment amount based on 'winner'.
      // For now, we simply unfreeze it to 'verified' so it can proceed.
      await Payment.findByIdAndUpdate(dispute.relatedEntityId, {
         status: "verified"
      });
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("Resolve Dispute Error:", error);
    return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
  }
}
