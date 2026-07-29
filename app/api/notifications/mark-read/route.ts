import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/notifications/mark-read
 * Body: { notificationId? } — omit to mark ALL as read
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      // Mark one as read
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: session.id },
        { isRead: true }
      );
    } else {
      // Mark ALL as read
      await Notification.updateMany(
        { recipientId: session.id, isRead: false },
        { isRead: true }
      );
    }

    return NextResponse.json({ message: "Marked as read" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
