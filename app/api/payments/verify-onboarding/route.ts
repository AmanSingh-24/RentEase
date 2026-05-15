import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Property from "@/models/Property";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    // 1. Verify Signature (Security Guard)
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });

    // 2. Fetch User & Property
    const user = await User.findById(userId).populate("propertyId");
    const property = user.propertyId;

    // ✅ THE FIX: Use leaseStartDate for labeling the first payment
    const leaseDate = new Date(property.leaseStartDate);
    const startMonth = leaseDate.toLocaleString('default', { month: 'long' });
    const startYear = leaseDate.getFullYear();

    // 3. CREATE DEPOSIT RECORD
    await Payment.create({
      propertyId: property._id,
      tenantId: userId,
      type: "deposit",
      month: startMonth, // Matches lease start month
      year: startYear,
      baseRent: property.depositAmount,
      totalAmountPaid: property.depositAmount,
      gatewayTransactionId: razorpay_payment_id,
      status: "completed"
    });

    // 4. CREATE 1st MONTH RENT RECORD
    await Payment.create({
      propertyId: property._id,
      tenantId: userId,
      type: "rent",
      month: startMonth, // 🔥 Now correctly attributes payment to April (if lease starts April)
      year: startYear,
      baseRent: property.rentAmount,
      totalAmountPaid: property.rentAmount,
      gatewayTransactionId: razorpay_payment_id,
      status: "completed"
    });

    property.status = "occupied";
    await property.save();
    user.isOnboarded = true;
    await user.save();

    return NextResponse.json({ message: "Residency Unlocked Correctially" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}