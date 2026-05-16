import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "tenant") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exit = await ExitProcess.findOne({ 
      tenantId: session.id, 
      status: { $ne: "archived" } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ exit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}