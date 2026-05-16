import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Find all properties belonging to this owner
    const properties = await Property.find({ ownerId: session.id });

    const tenantStatusReport = await Promise.all(properties.map(async (prop) => {
      // Find the tenant linked to this property
      const tenant = await User.findOne({ 
        $or: [{ propertyId: prop._id }, { _id: prop.tenantId }] 
      });

      if (!tenant) return null;

      // 2. Run Gap Analysis (January to February 2026)
      const startDate = new Date(prop.leaseStartDate || "2026-01-01");
      const currentDate = new Date();
      let unpaidMonths = [];
      let totalPaid = 0;

      let tempDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (tempDate <= currentDate) {
        const month = tempDate.toLocaleString('default', { month: 'long' });
        const year = tempDate.getFullYear();

        const payment = await Payment.findOne({
          propertyId: prop._id,
          tenantId: tenant._id,
          month,
          year,
          type: "rent"
        });

        if (!payment) {
          unpaidMonths.push(`${month} ${year}`);
        } else {
          totalPaid += payment.amount;
        }
        tempDate.setMonth(tempDate.getMonth() + 1);
      }

      return {
        propertyId: prop._id,
        address: prop.address,
        tenantName: tenant.name,
        tenantId: tenant._id,
        status: unpaidMonths.length > 0 ? "Pending" : "Paid",
        unpaidMonths,
        totalPaid,
        rentAmount: prop.rentAmount
      };
    }));

    // Filter out vacant properties
    const activeTenants = tenantStatusReport.filter(Boolean);

    return NextResponse.json({ 
      tenants: activeTenants,
      stats: {
        totalRevenue: activeTenants.reduce((sum, t) => sum + (t?.totalPaid || 0), 0),
        pendingTenants: activeTenants.filter(t => t?.status === "Pending").length
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}