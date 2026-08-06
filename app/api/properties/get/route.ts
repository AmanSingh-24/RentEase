import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ Fetch only approved properties that should display in owner dashboard (listingStatus: active_marketplace or occupied)
    const properties = await Property.find({ 
      ownerId: session.id,
      listingStatus: { $in: ["active_marketplace", "occupied"] }
    })
      .populate("tenantId", "name email") 
      .sort({ createdAt: -1 });

    return NextResponse.json({ properties }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}