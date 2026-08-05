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
    
    const User = (await import("@/models/User")).default;
    const user = await User.findById(session.id);
    
    // Find property assigned directly by tenantId OR linked in User.propertyId
    const query: any = { $or: [{ tenantId: session.id }] };
    if (user && user.propertyId) {
      query.$or.push({ _id: user.propertyId });
    }

    const property = await Property.findOne(query).populate("ownerId");

    console.log("Database Search Result:", property); // Check your terminal to see if it found it!

    return NextResponse.json({ property });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}