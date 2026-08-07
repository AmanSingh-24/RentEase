import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import Payment from "@/models/Payment";
import Maintenance from "@/models/Maintenance";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";
import { calculateLedgerItem } from "@/lib/financials";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Get all properties owned by this user
    const properties = await Property.find({ ownerId: session.id });
    const propertyIds = properties.map(p => p._id);

    // 2. Fetch ALL real rent and deposit payments from the database
    const dbPayments = await Payment.find({ 
      propertyId: { $in: propertyIds },
      type: { $in: ["rent", "deposit"] } 
    }).populate("propertyId tenantId");

    const now = new Date();
    const currentMonthName = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    // 3. Generate dynamic ledger items for current cycle
    const overdueReports = await Promise.all(properties.map(async (prop) => {
      const tenant = await User.findOne({ propertyId: prop._id });
      if (!tenant || !prop.leaseStartDate) return null;
      
      // Check if current month is paid
      const existingPayment = dbPayments.find(p => 
        p.propertyId._id.toString() === prop._id.toString() && 
        p.month === currentMonthName && 
        p.year === currentYear &&
        p.type === "rent"
      );

      // Only calculate if unpaid
      if (!existingPayment) {
        return calculateLedgerItem(prop, tenant, currentMonthName, currentYear, null);
      }
      return null;
    }));

    const proMaintenance = await Maintenance.find({
      propertyId: { $in: propertyIds },
      isSolvedByPro: true
    }).populate("tenantId");

    // 5. Fetch Unapplied Maintenance Credits (Tenant-led fixes waiting for next invoice)
    const unappliedRepairs = await Maintenance.find({
      propertyId: { $in: propertyIds },
      isAmountApproved: true,
      isFixedByTenant: true,
      isCredited: { $ne: true }
    });

    const finalReport = [
      ...dbPayments.map(p => ({
        _id: p._id,
        propertyId: p.propertyId,
        tenantId: p.tenantId,
        month: p.month,
        year: p.year,
        type: p.type,
        status: p.status,
        amount: p.totalAmountPaid || p.amount,
        breakdown: p.type === "rent" ? {
          base: p.baseRent,
          credit: p.maintenanceCredit,
          penalty: p.penaltyApplied
        } : null
      })), 
      ...overdueReports.filter(Boolean)
    ];

    return NextResponse.json({ payments: finalReport, proMaintenance, unappliedRepairs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}