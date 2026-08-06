import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Inspection from "@/models/Inspection";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Find all properties owned by this user
    const properties = await Property.find({ ownerId: session.id }).select("_id");
    const propertyIds = properties.map(p => p._id);

    // 2. Read status query param (default to pending)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    // 3. Find inspections matching criteria
    const query: any = { propertyId: { $in: propertyIds } };
    if (status !== "all") {
      query.status = status;
    }

    const inspections = await Inspection.find(query)
      .populate("tenantId", "name email")
      .populate("propertyId", "address")
      .sort({ createdAt: -1 });

    return NextResponse.json({ inspections }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}