import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    const exit = await ExitProcess.findOne({ 
      tenantId, 
      status: { $ne: "archived" } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ exit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}