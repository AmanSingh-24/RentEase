// app/api/properties/tenant-view/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "tenant") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    
    // ✅ FIX: Changed 'tenants' (plural) to 'tenantId' (singular) 
    // to match your database dump exactly.
    const property = await Property.findOne({ tenantId: session.id }).populate("ownerId");

    console.log("Database Search Result:", property); // Check your terminal to see if it found it!

    return NextResponse.json({ property });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}