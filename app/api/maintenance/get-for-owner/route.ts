import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Find all properties belonging to this owner
    const properties = await Property.find({ ownerId: session.id }).select("_id");
    const propertyIds = properties.map(p => p._id);

    // 2. Find all maintenance issues for these properties
    // We populate 'tenantId' and 'propertyId' to get names and addresses
    const issues = await Maintenance.find({ 
      propertyId: { $in: propertyIds } 
    })
    .populate("tenantId", "name email")
    .populate("propertyId", "address")
    .sort({ createdAt: -1 });

    return NextResponse.json({ issues }, { status: 200 });
  } catch (error: any) {
    console.error("OWNER_MAINTENANCE_GET_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}