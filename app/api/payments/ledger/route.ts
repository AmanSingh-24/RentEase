import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Property from "@/models/Property";
import Maintenance from "@/models/Maintenance";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const user = await User.findById(userId);
    const property = await Property.findById(user.propertyId).populate("ownerId");

    const startDate = new Date(property.leaseStartDate);
    const currentDate = new Date();
    const ledger = [];

    let tempDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (tempDate <= currentDate) {
      const monthName = tempDate.toLocaleString('default', { month: 'long' });
      const year = tempDate.getFullYear();

      const paymentRecord = await Payment.findOne({
        propertyId: property._id,
        tenantId: userId,
        month: monthName,
        year: year
      });

      let status = paymentRecord ? "Paid" : "Pending";
      let finalAmount = property.rentAmount;
      let breakdown = { base: property.rentAmount, credit: 0, penalty: 0 };

      if (status === "Pending") {
        // 1. SCALING MAINTENANCE CREDITS
        const approvedRepairs = await Maintenance.find({
          tenantId: userId,
          responsibility: "owner",
          isAmountApproved: true,
          isCredited: { $ne: true } // Only fetch if not already used in a previous month
        });

        const totalCredit = approvedRepairs.reduce((sum, item) => sum + item.finalInvoice.amount, 0);
        breakdown.credit = totalCredit;

        // 2. DYNAMIC PENALTY LOGIC (Owner controlled)
        if (property.latePenaltyEnabled) {
          const dayOfMonth = currentDate.getDate();
          if (dayOfMonth > 10) {
            breakdown.penalty = Math.round(property.rentAmount * 0.10); // 10%
          } else if (dayOfMonth > 5) {
            breakdown.penalty = Math.round(property.rentAmount * 0.05); // 5%
          }
        }
        finalAmount = (breakdown.base + breakdown.penalty) - breakdown.credit;
      } else {
        finalAmount = paymentRecord.totalAmountPaid;
      }

      ledger.push({
        month: monthName,
        year: year,
        status,
        amount: finalAmount,
        breakdown: paymentRecord ? null : breakdown, // Show breakdown only for pending
        date: paymentRecord?.createdAt || null
      });

      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    return NextResponse.json({ property, ledger: ledger.reverse() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}