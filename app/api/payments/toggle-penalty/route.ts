import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import FinancialAdjustment from "@/models/FinancialAdjustment";
import { getSessionUser } from "@/lib/auth-helper";
import { logActivity } from "@/lib/logActivity";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, tenantId, month, year, isLateFeeWaived } = await request.json();

    if (!propertyId || !tenantId || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adjustment = await FinancialAdjustment.findOneAndUpdate(
      { propertyId, tenantId, month, year },
      { $set: { isLateFeeWaived } },
      { new: true, upsert: true }
    );

    // Notify the tenant
    const actionText = isLateFeeWaived ? "waived" : "applied";
    await logActivity({
      propertyId,
      recipientId: tenantId,
      senderId: session.id,
      title: "Late Fee Adjustment",
      desc: `Your landlord has ${actionText} the late fee for ${month} ${year}.`,
      category: "financial"
    });

    return NextResponse.json({ success: true, adjustment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
