import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import FinancialAdjustment from "@/models/FinancialAdjustment";
import { getSessionUser } from "@/lib/auth-helper";
import { logActivity } from "@/lib/logActivity";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, tenantId, month, year } = await request.json();

    if (!propertyId || !tenantId || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if nudged recently (e.g., limit to 3 within 24 hours)
    let adjustment = await FinancialAdjustment.findOne({ propertyId, tenantId, month, year });
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let recentNudges = 0;
    if (adjustment && adjustment.nudgeHistory) {
      // Filter out nudges older than 24 hours
      recentNudges = adjustment.nudgeHistory.filter((date: Date) => date >= twentyFourHoursAgo).length;
      
      if (recentNudges >= 3) {
        return NextResponse.json({ error: "You can only send up to 3 reminders per 24 hours." }, { status: 429 });
      }
    }

    // Update nudge timestamp and history
    adjustment = await FinancialAdjustment.findOneAndUpdate(
      { propertyId, tenantId, month, year },
      { 
        $set: { lastNudgedAt: now },
        $push: { nudgeHistory: now } 
      },
      { new: true, upsert: true }
    );

    // 1. In-App Notification
    await logActivity({
      propertyId,
      recipientId: tenantId,
      senderId: session.id,
      title: "Rent Reminder",
      desc: `Reminder from your landlord: Your rent for ${month} ${year} is overdue. Please settle immediately.`,
      category: "alert"
    });

    // 2. Email Notification (Mocked for now, can be wired to SendGrid/Nodemailer)
    const tenant = await User.findById(tenantId);
    if (tenant?.email) {
      console.log(`[EMAIL DISPATCH] To: ${tenant.email} | Subject: URGENT: Rent Reminder for ${month} ${year}`);
    }

    return NextResponse.json({ success: true, message: "Nudge sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}