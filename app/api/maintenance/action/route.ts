import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import { logActivity } from "@/lib/logActivity";
import cloudinary from "@/lib/cloudinary";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { issueId, action, contractorName, contractorContact, arrival, feedback, receiptAmount, workerName, workerContact, hasOfficialBill, afterImage } = body;

    const issue = await Maintenance.findById(issueId);
    if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });

    let updateData: any = {};

    // 1. OWNER ASSIGNMENT ACTIONS
    if (action === "approve_contractor") {
      updateData.status = "owner_led_fix";
      updateData.contractorInfo = { name: contractorName, contact: contractorContact, arrival };
    } 
    else if (action === "tenant_fix") {
      updateData.status = "tenant_led_fix";
    } 
    else if (action === "reject") {
      updateData.status = "rejected";
      updateData.ownerFeedback = feedback;
    }

    // 2. TENANT RESOLUTION (Handles Visual & Verbal Proof)
    if (action === "resolve") {
      let uploadedUrl = "";
      // If a new base64 image is provided, upload it to the Resolutions folder
      if (afterImage && afterImage.startsWith("data:image")) {
        const cloudRes = await cloudinary.uploader.upload(afterImage, { 
            folder: "rentease/maintenance_resolutions" 
        });
        uploadedUrl = cloudRes.secure_url;
      }

      updateData.status = "resolved";
      updateData.finalInvoice = { 
        amount: Number(receiptAmount) || 0, 
        url: uploadedUrl 
      };
      updateData.resolutionEvidence = {
        workerName,
        workerContact,
        hasOfficialBill,
        afterImage: uploadedUrl // This fills the blank green box in your screenshot
      };
    }

    // 3. OWNER VERIFICATION (Moves to History)
    if (action === "verify_and_archive") {
      updateData.isAmountApproved = true;
    }

    // 4. CORRECTION LOOP: Owner Disputes Verification
    if (action === "dispute_verification") {
      updateData.status = "tenant_led_fix";
      updateData.isAmountApproved = false;
      updateData.ownerFeedback = feedback;
    }

    // 5. OWNER VERIFIES WORKER DETAILS
    if (action === "verify_worker") {
      updateData.resolutionEvidence = {
        ...issue.resolutionEvidence,
        workerVerified: true,
        workerVerifiedAt: new Date()
      };
    }

    const updatedIssue = await Maintenance.findByIdAndUpdate(issueId, { $set: updateData }, { new: true }).populate("propertyId");

    return NextResponse.json({ message: "Success", updatedIssue }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}