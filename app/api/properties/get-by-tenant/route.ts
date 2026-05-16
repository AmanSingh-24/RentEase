import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "tenant") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Find the property where this tenant is currently staying
    const property = await Property.findOne({ tenantId: session.id });

    if (!property) {
      return NextResponse.json({ property: null, message: "No property linked to this tenant" }, { status: 200 });
    }

    // 3. Return the property (which includes property._id and ownerId)
    return NextResponse.json({ property });
  } catch (error: any) {
    console.error("GET_BY_TENANT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}