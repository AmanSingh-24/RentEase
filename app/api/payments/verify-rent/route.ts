import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Maintenance from "@/models/Maintenance"; // ✅ Required for Credit Burn
import Notification from "@/models/Notification";
import { logActivity } from "@/lib/logActivity";
import { getSessionUser } from "@/lib/auth-helper";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    // Get user from secure session instead of frontend payload
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.id;

    const body = await request.json();

    // 1. Destructure all fields from frontend (Matching Schema names)
    const { 
      month, year, 
      totalAmountPaid, 
      baseRent, 
      maintenanceCredit, 
      penaltyApplied,
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = body;

    // 2. Security Check: Verify Razorpay Signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Unauthorized Payment Attempt" }, { status: 400 });
    }

    const user = await User.findById(userId).populate("propertyId");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 3. Create the Secured Rent Payment Record
    // ✅ SYNCED: Uses totalAmountPaid and baseRent as required by Schema
    const payment = await Payment.create({
      propertyId: user.propertyId._id,
      tenantId: userId,
      type: "rent",
      month,
      year,
      baseRent: Number(baseRent),
      maintenanceCredit: Number(maintenanceCredit || 0),
      penaltyApplied: Number(penaltyApplied || 0),
      totalAmountPaid: Number(totalAmountPaid), 
      gatewayTransactionId: razorpay_payment_id,
      status: "completed"
    });

    // 4. 🔥 THE CREDIT BURN
    // Once paid, mark the repairs as 'isCredited' so they don't apply to next month
    await Maintenance.updateMany(
      { 
        tenantId: userId, 
        responsibility: "owner", 
        isAmountApproved: true, 
        isCredited: { $ne: true } 
      },
      { $set: { isCredited: true } }
    );

    // 5. Cleanup Nudges & Log Activity
    await Notification.deleteMany({ recipientId: userId, type: "nudge" });
    await logActivity({
      propertyId: user.propertyId._id,
      recipientId: user.propertyId.ownerId,
      senderId: userId,
      title: "Monthly Rent Verified 🛡️",
      desc: `${user.name} paid ₹${totalAmountPaid} for ${month}. Maintenance credits used and signature verified.`,
      category: "payment"
    });

    return NextResponse.json({ message: "Rent secured and ledger balanced", payment }, { status: 200 });

  } catch (error: any) {
    console.error("VERIFY_RENT_API_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}