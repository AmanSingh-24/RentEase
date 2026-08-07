import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Property from "@/models/Property";
import Maintenance from "@/models/Maintenance";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";
import { calculateLedgerItem } from "@/lib/financials";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "tenant") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await User.findById(session.id);
    const property = await Property.findById(user.propertyId).populate("ownerId");

    const leaseDate = property.leaseStartDate ? new Date(property.leaseStartDate) : new Date();
    const currentDate = new Date(); 
    const ledger = [];

    // Loop from Lease Start Month to Current Month
    let tempDate = new Date(leaseDate.getFullYear(), leaseDate.getMonth(), 1);

    while (tempDate <= currentDate) {
      const monthName = tempDate.toLocaleString('default', { month: 'long' });
      const year = tempDate.getFullYear();

      const paymentRecord = await Payment.findOne({
        propertyId: property._id,
        tenantId: session.id,
        month: monthName,
        year: year,
        type: "rent"
      });

      const ledgerItem = await calculateLedgerItem(property, user, monthName, year, paymentRecord);
      if (ledgerItem) {
        ledger.push({
          month: ledgerItem.month,
          year: ledgerItem.year,
          status: ledgerItem.status === "completed" ? "Paid" : "Pending",
          amount: ledgerItem.amount,
          breakdown: ledgerItem.breakdown,
          date: paymentRecord ? paymentRecord.createdAt : null,
          transactionId: paymentRecord ? paymentRecord.gatewayTransactionId : null
        });
      }

      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    const unappliedRepairs = await Maintenance.find({
      tenantId: session.id,
      responsibility: "owner",
      isAmountApproved: true,
      isCredited: { $ne: true }
    });
    const totalUnappliedCredit = unappliedRepairs.reduce((sum, item) => sum + (item.finalInvoice?.amount || 0), 0);

    return NextResponse.json({ 
      property, 
      ledger: ledger.reverse(),
      totalUnappliedCredit
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}