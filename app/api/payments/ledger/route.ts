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
    // Populate ownerId and maintenanceRules to get the threshold/grace period
    const property = await Property.findById(user.propertyId).populate("ownerId");

    const leaseDate = new Date(property.leaseStartDate);
    const currentDate = new Date(); // May 15, 2026
    const ledger = [];

    // Loop from Lease Start Month to Current Month
    let tempDate = new Date(leaseDate.getFullYear(), leaseDate.getMonth(), 1);

    while (tempDate <= currentDate) {
      const monthName = tempDate.toLocaleString('default', { month: 'long' });
      const year = tempDate.getFullYear();

      // Check if a REAL payment exists in the DB for this month
      const paymentRecord = await Payment.findOne({
        propertyId: property._id,
        tenantId: userId,
        month: monthName,
        year: year,
        type: "rent"
      });

      if (paymentRecord) {
        ledger.push({
          month: monthName,
          year: year,
          status: "Paid",
          amount: paymentRecord.totalAmountPaid,
          date: paymentRecord.createdAt,
          transactionId: paymentRecord.gatewayTransactionId
        });
      } else {
        // 🚀 GENERATE DYNAMIC VIRTUAL INVOICE FOR PENDING MONTHS
        
        // 1. Calculate Penalty (It's May 15th, so > 10 days since 1st)
        let penalty = 0;
        if (property.latePenaltyEnabled !== false) { // Assuming it's enabled by default
          const day = currentDate.getDate();
          if (day > 10) penalty = Math.round(property.rentAmount * 0.10);
          else if (day > 5) penalty = Math.round(property.rentAmount * 0.05);
        }

        // 2. Fetch Approved Maintenance Credits
        const approvedRepairs = await Maintenance.find({
          tenantId: userId,
          responsibility: "owner",
          isAmountApproved: true,
          isCredited: { $ne: true } // Pick repairs not yet "used up"
        });

        const totalCredit = approvedRepairs.reduce((sum, item) => sum + (item.finalInvoice?.amount || 0), 0);

        // 3. Final Calculation
        const finalPayable = (property.rentAmount + penalty) - totalCredit;

        ledger.push({
          month: monthName,
          year: year,
          status: "Pending",
          amount: finalPayable,
          // ✅ THIS BREAKDOWN OBJECT IS WHAT THE FRONTEND NEEDS
          breakdown: {
            base: property.rentAmount,
            penalty: penalty,
            credit: totalCredit
          }
        });
      }

      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    return NextResponse.json({ property, ledger: ledger.reverse() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}