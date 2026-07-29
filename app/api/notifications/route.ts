import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * GET /api/notifications
 * Returns the last 20 notifications for the logged-in user.
 * Unread ones come first, then sorted by date desc.
 */
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await Notification.find({ recipientId: session.id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      recipientId: session.id,
      isRead: false,
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
