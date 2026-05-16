import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const exitId = searchParams.get("exitId");
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });

    if (!exitId) {
      return NextResponse.json({ error: "Exit ID is required" }, { status: 400 });
    }

    // ✅ LOGIC: Fetch the archived record and fill in the details
    const exit = await ExitProcess.findById(exitId)
      .populate("propertyId", "address")
      .populate("tenantId", "name email");

    if (!exit) {
      return NextResponse.json({ error: "Archived record not found" }, { status: 404 });
    }
    
    // Verify ownership: user must be either the tenant or the owner
    if (exit.tenantId._id.toString() !== session.id && exit.ownerId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ exit }, { status: 200 });
  } catch (error: any) {
    console.error("FETCH_ARCHIVE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}