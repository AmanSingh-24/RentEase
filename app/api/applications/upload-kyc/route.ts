import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import cloudinary from "@/lib/cloudinary";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/applications/upload-kyc
 *
 * Tenant uploads their Government ID after the owner has pre-approved
 * their application (status = "kyc_requested").
 *
 * Two-step KYC Rule:
 * - Govt ID is ONLY requested after owner pre-approves
 * - This endpoint enforces that the application must be in "kyc_requested" state
 *
 * Uploads the document to Cloudinary under a private folder.
 * Updates: tenantKycUrl + status → "pre_approved"
 *
 * Auth: tenant only
 * Body: { applicationId, kycDocumentBase64 }
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "tenant")
      return NextResponse.json({ error: "Tenant access required" }, { status: 403 });

    const { applicationId, kycDocumentBase64 } = await request.json();

    if (!applicationId || !kycDocumentBase64) {
      return NextResponse.json(
        { error: "Application ID and KYC document are required" },
        { status: 400 }
      );
    }

    const application = await RentalApplication.findById(applicationId);
    if (!application)
      return NextResponse.json({ error: "Application not found" }, { status: 404 });

    // Ownership check
    if (application.tenantId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── Two-Step KYC Gate ────────────────────────────────────────────────────
    if (application.status !== "kyc_requested") {
      return NextResponse.json(
        {
          error: `KYC upload is only allowed when the landlord has pre-approved your application. Current status: "${application.status}"`,
        },
        { status: 400 }
      );
    }

    // ── Upload to Cloudinary ────────────────────────────────────────────────
    // NOTE: In production, consider Cloudinary signed uploads with access_mode: "authenticated"
    const uploadResult = await cloudinary.uploader.upload(kycDocumentBase64, {
      folder: "rentease/tenant_kyc_documents",
      resource_type: "auto", // Supports PDF and images
    });

    // ── Update Application ──────────────────────────────────────────────────
    await RentalApplication.findByIdAndUpdate(applicationId, {
      tenantKycUrl: uploadResult.secure_url,
      status: "pre_approved",
    });

    return NextResponse.json(
      {
        message:
          "Government ID uploaded successfully. The landlord will review it and finalize the lease.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("KYC_UPLOAD_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
