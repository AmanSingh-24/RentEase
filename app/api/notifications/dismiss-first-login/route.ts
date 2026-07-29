import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/notifications/dismiss-first-login
 * Called when user closes the firstHostLogin congratulations modal.
 * Sets firstHostLogin = false so the modal never shows again.
 */
export async function POST() {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await User.findByIdAndUpdate(session.id, { firstHostLogin: false });
    return NextResponse.json({ message: "First login flag cleared" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
