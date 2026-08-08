import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import User from "@/models/User";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // --- LAZY 24-HOUR AUTO-SWEEP (Garbage Collection) ---
    // Automatically archive any tenant who abandoned the portal after getting paid
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleRecords = await ExitProcess.find({
      ownerId: session.id,
      status: "payout_released",
      updatedAt: { $lt: yesterday }
    });

    for (const stale of staleRecords) {
      await ExitProcess.findByIdAndUpdate(stale._id, { status: "archived", updatedAt: new Date() });
      await Property.findByIdAndUpdate(stale.propertyId, {
        status: "vacant", 
        listing_status: "active_marketplace",
        tenantId: null, 
        activeExitId: null,
        $push: { pastTenants: { tenantId: stale.tenantId, movedOutAt: new Date(), exitRecordId: stale._id } }
      });
      await User.findByIdAndUpdate(stale.tenantId, { propertyId: null, isOnboarded: false });
    }
    // ----------------------------------------------------

    // Find all exit processes for this owner
    const requests = await ExitProcess.find({ 
      ownerId: session.id,
      status: { $in: ["notice_served", "notice_rescheduled", "notice_accepted", "photos_submitted", "physical_inspection_required", "physical_inspection_done", "inspection_completed", "settled", "disputed", "payout_released", "archived"] }
    })
    .populate({ path: "tenantId", select: "name email" })
    .populate({ path: "propertyId", select: "address" })
    .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}