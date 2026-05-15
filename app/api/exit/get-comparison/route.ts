import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import Property from "@/models/Property";
import Inspection from "@/models/Inspection";
import Maintenance from "@/models/Maintenance"; // ✅ Added to check history

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const exitId = searchParams.get("exitId");

    const exit = await ExitProcess.findById(exitId).populate("propertyId tenantId");
    if (!exit) return NextResponse.json({ error: "Exit not found" }, { status: 404 });

    const propertyObj = exit.propertyId;
    
    // 1. Fetch Move-In Baseline
    const moveInInspection = await Inspection.findOne({ propertyId: propertyObj._id, type: "move-in" });

    // 2. Fetch all Resolved Maintenance for this property during the tenancy
    const maintenanceRecords = await Maintenance.find({ 
      propertyId: propertyObj._id, 
      status: "resolved" 
    });

    let comparisonGrid = [];
    const tenantPhotos = exit.moveOutPhotos || [];

    // Helper to check if item had maintenance
    const checkMaintenance = (room: string, item: string) => {
       return maintenanceRecords.some(m => m.roomName === room && m.itemName === item);
    };

    if (moveInInspection && moveInInspection.report?.length > 0) {
      comparisonGrid = moveInInspection.report.map((baseline: any, idx: number) => ({
        roomName: baseline.roomName,
        itemName: baseline.itemName,
        area: `${baseline.roomName}: ${baseline.itemName}`,
        baselineUrl: baseline.photoUrl,
        proofUrl: tenantPhotos[idx]?.url || null,
        hasMaintenance: checkMaintenance(baseline.roomName, baseline.itemName) // ✅ Flag
      }));
    } else {
      // 🚀 FALLBACK: Property Structure
      let photoIdx = 0;
      propertyObj.structure.forEach((room: any) => {
        room.items.forEach((item: any) => {
          comparisonGrid.push({
            roomName: room.roomName,
            itemName: item.itemName,
            area: `${room.roomName}: ${item.itemName}`,
            baselineUrl: null,
            proofUrl: tenantPhotos[photoIdx]?.url || null,
            hasMaintenance: checkMaintenance(room.roomName, item.itemName) // ✅ Flag
          });
          photoIdx++;
        });
      });
    }

    return NextResponse.json({ exit, comparisonGrid, property: propertyObj });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}