import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Maintenance from "@/models/Maintenance";
import { logActivity } from "@/lib/logActivity";
import cloudinary from "@/lib/cloudinary";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { 
      issueId, action, contractorName, contractorContact, arrival, feedback, 
      receiptAmount, workerName, workerContact, afterImage, isResubmission,
      repairCategory, transactionId, paymentProof 
    } = body;

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
      // Keep original responsibility (does NOT force 'tenant' responsibility, allowing owner-financed credit)
    } 
    else if (action === "reject") {
      updateData.status = "rejected";
      updateData.ownerFeedback = feedback;
    }

    // 2. TENANT RESOLUTION (Handles Visual & Verbal Proof)
    if (action === "resolve") {
      let afterImageUrl = "";
      let paymentProofUrl = "";

      // If a new base64 image is provided, upload it to the Resolutions folder
      if (afterImage && afterImage.startsWith("data:image")) {
        const cloudRes = await cloudinary.uploader.upload(afterImage, { 
            folder: "rentease/maintenance_resolutions" 
        });
        afterImageUrl = cloudRes.secure_url;
      }

      // If a new base64 file is provided for payment proof, upload it
      if (paymentProof && paymentProof.startsWith("data:")) {
        const cloudRes2 = await cloudinary.uploader.upload(paymentProof, {
            folder: "rentease/maintenance_receipts"
        });
        paymentProofUrl = cloudRes2.secure_url;
      }

      updateData.status = "resolved";
      updateData.isFixedByTenant = true;
      updateData.finalInvoice = { 
        amount: Number(receiptAmount) || 0, 
        url: paymentProofUrl,
        transactionId: transactionId || ""
      };
      updateData.resolutionEvidence = {
        workerName: workerName || "",
        workerContact: workerContact || "",
        repairCategory: repairCategory || "",
        afterImage: afterImageUrl,
        workerVerified: false
      };

      // If this is a resubmission after rejection, clear the feedback
      if (isResubmission) {
        updateData.ownerFeedback = null;
      }
    }

    // 3. OWNER VERIFICATION (Moves to History + Auto-verify)
    if (action === "verify_and_archive") {
      updateData.isAmountApproved = true;
      // Auto-verify worker details under the hood to bypass the double-click workflow
      updateData.resolutionEvidence = {
        ...(issue.resolutionEvidence || {}),
        workerVerified: true,
        workerVerifiedAt: new Date()
      };
    }

    // 4. OWNER REJECTS TENANT SUBMISSION (Keeps status as resolved, adds feedback)
    if (action === "dispute_verification") {
      // Keep status as resolved, just add ownerFeedback
      // This allows tenant to see it needs resubmission
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

    if (action === "professional_work_complete") {
      updateData.status = "resolved";
      updateData.isSolvedByPro = true;
      // Preserve existing contractor info for owner reference
    }

    // 7. TENANT RESUBMITS AFTER REJECTION (Clears feedback, stays in resolved for reediting)
    if (action === "resubmit_after_rejection") {
      // Clear the feedback so tenant can modify and resubmit
      updateData.ownerFeedback = null;
      updateData.isAmountApproved = false;
      // Status stays "resolved" - tenant needs to update evidence and submit again
    }

    const updatedIssue = await Maintenance.findByIdAndUpdate(issueId, { $set: updateData }, { new: true }).populate("propertyId");

    return NextResponse.json({ message: "Success", updatedIssue }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}