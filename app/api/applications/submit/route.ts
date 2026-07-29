import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import RentalApplication from "@/models/RentalApplication";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

/**
 * POST /api/applications/submit
 *
 * Tenant expresses interest in a listed property.
 * Collects basic applicant details (income, occupants, move-in date).
 * Govt ID is NOT collected here — only after owner pre-approves.
 *
 * Auth: tenant only
 * Double-booking guard: Prevents duplicate applications for same property.
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();

    if (!session)
      return NextResponse.json(
        { error: "Please sign in to apply for a property" },
        { status: 401 }
      );
    if (session.role !== "tenant")
      return NextResponse.json(
        { error: "Only tenants can submit rental applications" },
        { status: 403 }
      );

    const body = await request.json();
    const {
      propertyId,
      fullName,
      phone,
      monthlyIncome,
      occupantsCount,
      targetMoveInDate,
      notes,
    } = body;

    if (!propertyId)
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });

    // Validate property exists and is still available
    const property = await Property.findById(propertyId);
    if (!property)
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.listingStatus !== "active_marketplace") {
      return NextResponse.json(
        { error: "This property is no longer available for applications" },
        { status: 400 }
      );
    }

    // ── Double-Application Guard ─────────────────────────────────────────────
    const existing = await RentalApplication.findOne({
      propertyId,
      tenantId: session.id,
      status: { $nin: ["rejected", "withdrawn"] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this property. Check your Applications tab." },
        { status: 400 }
      );
    }

    // ── Create Application ───────────────────────────────────────────────────
    const application = await RentalApplication.create({
      propertyId,
      tenantId: session.id,
      ownerId: property.ownerId,
      applicantDetails: {
        fullName: fullName || "",
        phone: phone || "",
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : 0,
        occupantsCount: occupantsCount ? Number(occupantsCount) : 1,
        targetMoveInDate: targetMoveInDate ? new Date(targetMoveInDate) : null,
        notes: notes || "",
      },
      status: "submitted",
    });

    return NextResponse.json(
      {
        message: "Application submitted successfully! The landlord will review it shortly.",
        applicationId: application._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("APPLICATION_SUBMIT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
