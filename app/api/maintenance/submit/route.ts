import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import Property from "@/models/Property";
import Inspection from "@/models/Inspection";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { tenantId, roomName, itemName, description, estimatedCost, images } = await request.json();

    // 1. Validation & Relationship Lookup
    const user = await User.findById(tenantId);
    if (!user || !user.propertyId) {
      return NextResponse.json({ error: "No active tenancy linked" }, { status: 400 });
    }

    const property = await Property.findById(user.propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property vault metadata missing" }, { status: 404 });
    }
    
    // 2. Fetch Move-In Baseline for this specific item
    const moveIn = await Inspection.findOne({ propertyId: property._id, type: "move-in" });
    const baselineItem = moveIn?.report?.find((r: any) => r.roomName === roomName && r.itemName === itemName);

    // 3. THE SMART TRIAGE LOGIC
    let responsibility = "owner";
    let causation = "wear_and_tear";

    const startDate = property.leaseStartDate ? new Date(property.leaseStartDate).getTime() : new Date().getTime();
    const daysSinceStart = (new Date().getTime() - startDate) / (1000 * 3600 * 24);
    const threshold = property.maintenanceRules?.repairThreshold || 500;
    const gracePeriod = property.maintenanceRules?.gracePeriodDays || 7;

    if (daysSinceStart <= gracePeriod) {
      responsibility = "owner";
      causation = "pre_existing";
    } 
    else if (baselineItem && (baselineItem.condition === "Poor" || baselineItem.condition === "Fair")) {
      responsibility = "owner";
      causation = "pre_existing";
    }
    else {
      // Threshold Protocol (Day 8 onwards with Good baseline)
      if (Number(estimatedCost) < threshold) {
        responsibility = "tenant";
        causation = "wear_and_tear";
      } else {
        responsibility = "owner";
        causation = "wear_and_tear";
      }
    }

    // 4. Upload Damage Photos
    const uploadedImages = await Promise.all(
      images.map(async (img: any) => {
        const res = await cloudinary.uploader.upload(img.url, { folder: "rentease/maintenance" });
        return { url: res.secure_url, timestamp: new Date() };
      })
    );

    // 5. CREATE THE ISSUE (Strict alignment with Robust Schema)
    const issue = await Maintenance.create({
      propertyId: property._id,
      tenantId,
      roomName, // ✅ Fixed: Matches Required Path
      itemName, // ✅ Fixed: Matches Required Path
      description,
      estimatedCost: Number(estimatedCost),
      issueImages: uploadedImages, // ✅ Fixed: Matches Robust Schema name
      responsibility,
      causation,
      // ✅ Fixed: Uses valid Enum values ('reported' or 'tenant_led_fix')
      status: responsibility === "tenant" ? "tenant_led_fix" : "reported" 
    });

    return NextResponse.json({ 
        message: "Issue Reported & Triage Complete", 
        responsibility, 
        issueId: issue._id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("🔥 MAINTENANCE_SUBMIT_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}