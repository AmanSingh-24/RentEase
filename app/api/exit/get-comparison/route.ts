import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import Property from "@/models/Property";
import Inspection from "@/models/Inspection";
import Maintenance from "@/models/Maintenance";
import { getSessionUser } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const exitId = searchParams.get("exitId");
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });

    const exit = await ExitProcess.findById(exitId).populate("propertyId tenantId");
    if (!exit) return NextResponse.json({ error: "Exit not found" }, { status: 404 });
    
    // Verify ownership: user must be either the tenant or the owner
    if (exit.tenantId._id.toString() !== session.id && exit.ownerId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyObj = exit.propertyId;
    
    // 1. Fetch Move-In Baseline
    const moveInInspection = await Inspection.findOne({ propertyId: propertyObj._id, type: "move-in" });

    // 2. Fetch all Maintenance for this property during the tenancy
    const maintenanceRecords = await Maintenance.find({ 
      propertyId: propertyObj._id 
    });

    let comparisonGrid = [];
    const tenantPhotos = exit.moveOutPhotos || [];

    // Helper to check if item had maintenance
    const checkMaintenance = (room: string, item: string) => {
       const rec = maintenanceRecords.find(m => 
         m.roomName?.toLowerCase() === room?.toLowerCase() && 
         m.itemName?.toLowerCase() === item?.toLowerCase()
       );
       return {
         hasMaintenance: !!rec,
         comment: rec ? rec.description : null
       };
    };

    if (moveInInspection && moveInInspection.report?.length > 0) {
      comparisonGrid = moveInInspection.report.map((baseline: any) => {
        const maint = checkMaintenance(baseline.roomName, baseline.itemName);
        const areaName = `${baseline.roomName}: ${baseline.itemName}`;
        const tPhoto = tenantPhotos.find((p: any) => p.area === areaName);
        return {
          roomName: baseline.roomName,
          itemName: baseline.itemName,
          area: areaName,
          baselineUrl: baseline.photoUrl,
          baselineCondition: baseline.condition || "Good",
          proofUrl: tPhoto?.url || null,
          condition: tPhoto?.condition || null,
          hasMaintenance: maint.hasMaintenance,
          maintenanceComment: maint.comment
        };
      });
    } else {
      // 🚀 FALLBACK: Property Structure
      let photoIdx = 0;
      propertyObj.structure.forEach((room: any) => {
        room.items.forEach((item: any) => {
          const maint = checkMaintenance(room.roomName, item.itemName);
          const areaName = `${room.roomName}: ${item.itemName}`;
          const tPhoto = tenantPhotos.find((p: any) => p.area === areaName);
          comparisonGrid.push({
            roomName: room.roomName,
            itemName: item.itemName,
            area: areaName,
            baselineUrl: null,
            baselineCondition: item.baselineCondition || "Good",
            proofUrl: tPhoto?.url || null,
            condition: tPhoto?.condition || null,
            hasMaintenance: maint.hasMaintenance,
            maintenanceComment: maint.comment
          });
        });
      });
    }

    return NextResponse.json({ exit, comparisonGrid, property: propertyObj });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}