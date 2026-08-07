import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";
import Property from "@/models/Property";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { exitId, status, isTenantSatisfied, tenantDisputeComment, moveOutDate, moveOutPhotos, transactionId } = await request.json();

    const updateData: any = { status };
    if (isTenantSatisfied !== undefined) updateData.isTenantSatisfied = isTenantSatisfied;
    if (tenantDisputeComment) updateData.tenantDisputeComment = tenantDisputeComment;
    if (moveOutDate) updateData.moveOutDate = new Date(moveOutDate);
    if (transactionId) updateData.transactionId = transactionId;

    if (moveOutPhotos) {
      updateData.moveOutPhotos = await Promise.all(
        moveOutPhotos.map(async (photo: any) => {
          if (photo.url && photo.url.startsWith("data:image/")) {
            const res = await cloudinary.uploader.upload(photo.url, { folder: "rentease/exit_witness" });
            return { ...photo, url: res.secure_url };
          }
          return photo;
        })
      );
    }

    const updatedExit = await ExitProcess.findByIdAndUpdate(exitId, updateData, { new: true });

    // 💣 THE ATOMIC CLEANUP: Unlink everything when archived
    if (status === "archived") {
      // 1. Property: Make Vacant, wipe tenant links, move to history
      await Property.findByIdAndUpdate(updatedExit.propertyId, {
        status: "vacant",
        tenantId: null,
        activeExitId: null,
        $push: { 
          pastTenants: { 
            tenantId: updatedExit.tenantId, 
            movedOutAt: new Date(),
            exitRecordId: updatedExit._id 
          } 
        }
      });

      // 2. User: wipe propertyId so they can join a new house
      await User.findByIdAndUpdate(updatedExit.tenantId, {
        propertyId: null,
        isOnboarded: false
      });
    }

    return NextResponse.json({ message: "Process Updated", updatedExit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}