import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });

    if (!id) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // ✅ LOGIC: Populate the active tenant and the past tenants
    const property = await Property.findById(id)
      .populate("tenantId", "name email")
      .populate("pastTenants.tenantId", "name email phone kycDetails");

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    
    // Verify ownership: user must be the owner or assigned tenant
    if (property.ownerId.toString() !== session.id && property.tenantId?._id.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (error: any) {
    console.error("GET_SINGLE_PROPERTY_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}