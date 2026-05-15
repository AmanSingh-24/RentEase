import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Inspection from "@/models/Inspection";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) return NextResponse.json({ error: "Property ID required" }, { status: 400 });

    console.log("🔍 Vault Search for Property:", propertyId);

    // 1. Fetch the inspection using the correct 'type'
    const inspection = await Inspection.findOne({ 
      propertyId: new mongoose.Types.ObjectId(propertyId),
      type: "move-in" 
    }).sort({ createdAt: -1 });

    if (!inspection) {
      console.log("❌ No move-in record found in DB.");
      return NextResponse.json({ error: "No baseline found" }, { status: 404 });
    }

    // ✅ FIX: Use 'report' instead of 'images' and handle the mapping
    // We map roomName + itemName into a single 'category' string for the UI
    const formattedSlots = (inspection.report || []).map((item: any) => ({
      category: `${item.roomName}: ${item.itemName}`,
      url: item.photoUrl, // This pulls the Base64/Cloudinary link
      condition: item.condition
    }));

    console.log(`✅ Found ${formattedSlots.length} items in move-in report.`);

    // Return the data as 'report' so the frontend can handle it specifically
    return NextResponse.json({ 
      report: inspection.report, // Raw data
      slots: formattedSlots      // Formatted for the Gallery UI
    });

  } catch (error: any) {
    console.error("🔥 VAULT FETCH ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}