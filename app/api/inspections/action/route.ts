import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Inspection from "@/models/Inspection";
import Property from "@/models/Property";
import { logActivity } from "@/lib/logActivity";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const { inspectionId, action, feedback } = await request.json();

    // 1. Logic: If verify, set status to verified; otherwise rejected
    const status = action === "verify" ? "verified" : "rejected";
    
    const updatedInspection = await Inspection.findByIdAndUpdate(
      inspectionId,
      { 
        status, 
        ownerFeedback: feedback || "",
        verifiedAt: action === "verify" ? new Date() : null 
      },
      { new: true }
    );

    if (!updatedInspection) {
      return NextResponse.json({ error: "Inspection Record not found" }, { status: 404 });
    }

    // 2. Sync Property State
    // This allows the owner to see at a glance that the property is "Audited"
    if (action === "verify") {
      await Property.findByIdAndUpdate(updatedInspection.propertyId, {
        "status": "occupied" // Ensure it's officially marked active
      });
    }

    // 3. 🔔 NOTIFY TENANT
    // This alert will show up in the tenant's Activity section
    await logActivity({
      propertyId: updatedInspection.propertyId,
      recipientId: updatedInspection.tenantId, 
      title: action === "verify" ? "Dashboard Unlocked 🔓" : "Audit Retake Required 📸",
      desc: action === "verify" 
        ? "Your move-in evidence is verified. Payments, Maintenance, and Exit portals are now active." 
        : `Verification failed. Feedback: ${feedback || "Photos were unclear. Please retake."}`,
      category: action === "verify" ? "legal" : "system"
    });

    // 4. Send Email Notification regarding Verification decision
    try {
      const User = (await import("@/models/User")).default;
      const tenantUser = await User.findById(updatedInspection.tenantId);
      const property = await Property.findById(updatedInspection.propertyId);
      
      if (tenantUser?.email && property) {
        if (action === "verify") {
          // Dynamic import of Resend helper
          const { sendTenantFinalApprovalEmail } = await import("@/lib/email");
          sendTenantFinalApprovalEmail(
            tenantUser.email,
            tenantUser.name || "Tenant",
            property.address
          ).catch((err) => console.error("Final approval verification email failed:", err));
        } else {
          // Send reject/retake notification email helper if exists
          const { sendOwnerApplicationDecisionEmail } = await import("@/lib/email");
          sendOwnerApplicationDecisionEmail(
            tenantUser.email,
            tenantUser.name || "Tenant",
            property.address,
            "rejected"
          ).catch((err) => console.error("Final rejection verification email failed:", err));
        }
      }
    } catch (emailErr) {
      console.error("Failed sending email notification during inspection action:", emailErr);
    }

    return NextResponse.json({ 
      message: `Vault ${status}`, 
      status: updatedInspection.status 
    }, { status: 200 });

  } catch (error: any) {
    console.error("ACTION_API_ERROR:", error);
    return NextResponse.json({ error: "Vault Action Failed" }, { status: 500 });
  }
}