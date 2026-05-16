import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/models/Message";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID context required" }, { status: 400 });
    }

    // Pull historical records ordered from oldest to newest for UI formatting
    const chatHistory = await Message.find({ propertyId })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ history: chatHistory }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}