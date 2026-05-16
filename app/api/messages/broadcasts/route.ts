// app/api/messages/broadcasts/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Message from "@/models/Message";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET() {
  try {
    await connectToDatabase();
    
    const session = await getSessionUser();
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Unauthorized access tier" }, { status: 401 });
    }

    // Pull historical owner broadcast instances sorted by date
    const broadcastHistory = await Message.find({
      senderId: session.id,
      messageType: "broadcast"
    })
    .sort({ createdAt: -1 })
    .lean();

    // Group fan-out entries by text content and timestamp to avoid duplicate cards on the owner's log
    const uniqueBroadcasts: any[] = [];
    const seenTexts = new Set();

    for (const msg of broadcastHistory) {
      if (!seenTexts.has(msg.messageText)) {
        seenTexts.add(msg.messageText);
        uniqueBroadcasts.push(msg);
      }
    }

    return NextResponse.json({ broadcasts: uniqueBroadcasts }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 FETCH_OWNER_BROADCASTS_ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}