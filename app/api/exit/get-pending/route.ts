import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch notices that are either newly served or currently being rescheduled
    const exits = await ExitProcess.find({ 
      ownerId: session.id, 
      status: { $in: ["notice_served", "notice_rescheduled"] } 
    })
    .populate("propertyId")
    .populate("tenantId", "name email")
    .sort({ createdAt: -1 });

    return NextResponse.json({ exits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}