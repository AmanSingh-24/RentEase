import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Notification from "@/models/Notification";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/admin/action
 *
 * Handles all Admin approve/reject/suspend/delist decisions.
 * Body: { type, targetId, reason? }
 *
 * Supported action types:
 *   - "approve_landlord"  → verificationStatus = "verified"
 *   - "reject_landlord"   → verificationStatus = "rejected" + reason
 *   - "approve_property"  → listingStatus = "active_marketplace"
 *   - "reject_property"   → listingStatus = "rejected" + reason
 *   - "suspend_user"      → verificationStatus = "rejected" + reason (works for any role)
 *   - "delist_property"   → listingStatus = "unlisted"
 *
 * Auth: admin only
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin")
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const { type, targetId, reason } = await request.json();

    if (!type || !targetId) {
      return NextResponse.json(
        { error: "Both 'type' and 'targetId' are required" },
        { status: 400 }
      );
    }

    switch (type) {
      // ── LANDLORD KYC ACTIONS ────────────────────────────────────────────────

      case "approve_landlord": {
        const user = await User.findByIdAndUpdate(
          targetId,
          {
            role: "owner", // Promote from pending to owner upon approval
            verificationStatus: "verified",
            hostStatus: "approved",
            firstHostLogin: true, // Triggers congrats modal on next visit
            rejectionReason: "",
          },
          { new: true }
        );
        // Create in-app notification
        await Notification.create({
          recipientId: targetId,
          type: "host_approved",
          title: "🎉 Host Application Approved!",
          message:
            "Congratulations! Your identity has been verified. Your property listing is now being reviewed for the marketplace.",
          actionUrl: "/dashboard-owner",
        });

        // Send email to owner
        if (user?.email) {
          const { sendOwnerApplicationDecisionEmail } = await import("@/lib/email");
          const userProp = await Property.findOne({ ownerId: targetId });
          sendOwnerApplicationDecisionEmail(
            user.email,
            user.name || "Landlord",
            userProp?.address || "your submitted property",
            "approved"
          ).catch((err) => console.error("Owner approve email failed:", err));
        }

        return NextResponse.json({
          message: "Landlord KYC approved. Notification sent to the host.",
        });
      }

      case "reject_landlord": {
        const rejectReason =
          reason || "Identity verification failed. Please resubmit with valid documents.";
        const user = await User.findByIdAndUpdate(targetId, {
          verificationStatus: "rejected",
          hostStatus: "rejected",
          rejectionReason: rejectReason,
        });
        await Notification.create({
          recipientId: targetId,
          type: "host_rejected",
          title: "Host Application Update",
          message: `Your host application was not approved. Reason: ${rejectReason}. You can update your documents and resubmit.`,
          actionUrl: "/onboarding/landlord",
        });

        // Send email to owner
        if (user?.email) {
          const { sendOwnerApplicationDecisionEmail } = await import("@/lib/email");
          const userProp = await Property.findOne({ ownerId: targetId });
          sendOwnerApplicationDecisionEmail(
            user.email,
            user.name || "Landlord",
            userProp?.address || "your submitted property",
            "rejected",
            rejectReason
          ).catch((err) => console.error("Owner reject email failed:", err));
        }

        return NextResponse.json({ message: "Landlord KYC rejected. Notification sent." });
      }

      // ── PROPERTY LISTING ACTIONS ────────────────────────────────────────────

      case "approve_property": {
        // Verify the owner's KYC is approved before their property can go live
        const property = await Property.findById(targetId).populate("ownerId");
        if (!property) {
          return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        const owner = property.ownerId as any;

        // Block if owner's KYC is not yet verified
        if (owner.verificationStatus !== "verified") {
          const isPendingKYC = owner.verificationStatus === "pending_verification";
          return NextResponse.json(
            {
              error: isPendingKYC
                ? "Owner's KYC is still pending review. Please approve the landlord's identity first, then approve this property."
                : "Owner's identity has not been verified. Approve the landlord's KYC first before approving their property.",
            },
            { status: 400 }
          );
        }

        await Property.findByIdAndUpdate(targetId, {
          listingStatus: "active_marketplace",
          rejectionReason: "",
        });
        // Notify the owner their listing is now live
        await Notification.create({
          recipientId: owner._id,
          type: "property_approved",
          title: "🏠 Your Property is Now Live!",
          message: `Your listing at ${property.address || property.city} has been approved and is now visible on the public marketplace.`,
          actionUrl: "/dashboard-owner",
        });

        // Send email to owner
        if (owner?.email) {
          const { sendOwnerApplicationDecisionEmail } = await import("@/lib/email");
          sendOwnerApplicationDecisionEmail(
            owner.email,
            owner.name || "Landlord",
            property.address || property.city,
            "approved"
          ).catch((err) => console.error("Property approve email failed:", err));
        }

        return NextResponse.json({
          message: "Property approved and live on the marketplace.",
        });
      }

      case "reject_property": {
        const rejectReason = reason || "Property documentation does not meet listing standards.";
        const property = await Property.findByIdAndUpdate(targetId, {
          listingStatus: "rejected",
          rejectionReason: rejectReason,
        }).populate("ownerId");

        if (property && (property.ownerId as any)?.email) {
          const owner = property.ownerId as any;
          const { sendOwnerApplicationDecisionEmail } = await import("@/lib/email");
          sendOwnerApplicationDecisionEmail(
            owner.email,
            owner.name || "Landlord",
            property.address || property.city,
            "rejected",
            rejectReason
          ).catch((err) => console.error("Property reject email failed:", err));
        }

        return NextResponse.json({ message: "Property listing rejected." });
      }

      // ── OVERSIGHT ACTIONS ───────────────────────────────────────────────────

      case "suspend_user": {
        // Works for both owners and tenants
        await User.findByIdAndUpdate(targetId, {
          verificationStatus: "rejected",
          rejectionReason: reason || "Account suspended by administrator.",
        });
        return NextResponse.json({ message: "User account suspended." });
      }

      case "delist_property": {
        await Property.findByIdAndUpdate(targetId, {
          listingStatus: "unlisted",
        });
        return NextResponse.json({
          message: "Property has been removed from the marketplace.",
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action type: "${type}". Valid types: approve_landlord, reject_landlord, approve_property, reject_property, suspend_user, delist_property`,
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("ADMIN_ACTION_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
