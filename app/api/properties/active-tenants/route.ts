// app/api/properties/active-tenants/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    await connectToDatabase();
    
    // 1. Get the verified owner session from the secure cookie
    const session = await getSessionUser();
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    }

    // 2. Find all properties belonging to this owner
    const properties = await Property.find({ ownerId: session.id }).lean();
    const propertyIds = properties.map((p: any) => p._id.toString());

    // 3. Find all onboarded tenants linked to those properties
    const tenants = await User.find({
      propertyId: { $in: propertyIds },
      role: "tenant"
    }).lean();

    // 4. Format the roster exactly how the frontend expectations are mapped
    const activeRoster = tenants.map((tenant: any) => {
      const associatedProperty = properties.find(
        (p: any) => p._id.toString() === tenant.propertyId.toString()
      );
      return {
        _id: tenant._id.toString(), // Unique node identifier
        tenantId: {
          _id: tenant._id,
          name: tenant.name,
          email: tenant.email
        },
        propertyId: {
          _id: associatedProperty?._id,
          address: associatedProperty?.address || "Unknown Property Address"
        }
      };
    });

    return NextResponse.json({ roster: activeRoster }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 ACTIVE_TENANTS_ROSTER_ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}