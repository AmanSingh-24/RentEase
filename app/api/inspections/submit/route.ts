import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Inspection from "@/models/Inspection";
import Property from "@/models/Property";
import User from "@/models/User";
import { logActivity } from "@/lib/logActivity";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { tenantId, report } = await request.json(); // report is itemized

    const user = await User.findById(tenantId);
    if (!user || !user.propertyId) {
      return NextResponse.json({ error: "No active tenancy linked" }, { status: 400 });
    }

    const property = await Property.findById(user.propertyId);
    if (!property) return NextResponse.json({ error: "Property metadata missing" }, { status: 404 });

    // ✅ LOGIC: Save the itemized report
    const inspection = await Inspection.findOneAndUpdate(
      { 
        tenantId, 
        propertyId: user.propertyId, 
        type: "move-in",
        status: { $ne: "verified" } 
      },
      { 
        report: report.map((item: any) => ({
          roomName: item.roomName,
          itemName: item.itemName,
          condition: item.condition,
          photoUrl: item.photoUrl || null,
          tenantComment: item.tenantComment || "",
          isCameraCaptured: true,
          timestamp: new Date()
        })),
        status: "pending",
        ownerFeedback: "",
        createdAt: new Date() 
      },
      { upsert: true, new: true }
    );

    // 🔔 Alert the owner
    await logActivity({
      propertyId: user.propertyId,
      recipientId: property.ownerId,
      senderId: tenantId,
      title: "Itemized Audit Submitted",
      desc: `${user.name} has completed the room-by-room audit for ${property.address}.`,
      category: "legal"
    });

    return NextResponse.json({ message: "Evidence secured in vault", inspection }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}