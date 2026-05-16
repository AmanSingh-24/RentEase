import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import User from "@/models/User";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find all exit processes for this owner that aren't 'archived' or 'settled'
    const requests = await ExitProcess.find({ 
      ownerId: session.id, 
      status: { $ne: "archived" } 
    })
    .populate({ path: "tenantId", select: "name email" })
    .populate({ path: "propertyId", select: "address" })
    .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}