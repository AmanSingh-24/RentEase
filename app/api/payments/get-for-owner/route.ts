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

    // 1. Get all properties owned by this user
    const properties = await Property.find({ ownerId: session.id });
    const propertyIds = properties.map(p => p._id);

    // 2. Fetch ALL real rent payments from the database (January, etc.)
    // This ensures your historical filters actually find data
    const dbPayments = await Payment.find({ 
      propertyId: { $in: propertyIds },
      type: "rent" 
    }).populate("propertyId tenantId");

    // 3. Generate Virtual "Overdue" status dynamically
    const now = new Date();
    const currentMonthName = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear();

    const overdueReports = await Promise.all(properties.map(async (prop) => {
      const tenant = await User.findOne({ propertyId: prop._id });
      if (!tenant || !prop.leaseStartDate) return null;

      const leaseStart = new Date(prop.leaseStartDate);
      
      // Check if current month is paid
      const hasPaidCurrent = dbPayments.some(p => 
        p.propertyId._id.toString() === prop._id.toString() && 
        p.month === currentMonthName && 
        p.year === currentYear
      );

      // Only show overdue if lease has already started and payment is missing
      if (!hasPaidCurrent && now >= leaseStart) {
        return {
          _id: `temp_${prop._id}_curr`,
          propertyId: prop,
          tenantId: tenant,
          month: currentMonthName,
          year: currentYear,
          type: "rent",
          status: "overdue",
          amount: prop.rentAmount
        };
      }
      return null;
    }));

    const finalReport = [...dbPayments, ...overdueReports.filter(Boolean)];

    return NextResponse.json({ payments: finalReport });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}