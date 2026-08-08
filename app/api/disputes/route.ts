import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth-helper";
import Dispute from "@/models/Dispute";
import Property from "@/models/Property";
import Payment from "@/models/Payment";

// GET /api/disputes?role=owner|tenant|admin
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || session.role;

    let disputes;

    if (role === "admin") {
      disputes = await Dispute.find({})
        .populate("propertyId", "title address")
        .populate("initiatorId", "name email role")
        .populate("respondentId", "name email role")
        .sort({ createdAt: -1 });
    } else {
      // For owner or tenant, they could be either initiator or respondent
      disputes = await Dispute.find({
        $or: [{ initiatorId: session.id }, { respondentId: session.id }]
      })
        .populate("propertyId", "title address")
        .populate("initiatorId", "name email role")
        .populate("respondentId", "name email role")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Fetch Disputes Error:", error);
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

// POST /api/disputes - Create a dispute
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      propertyId, 
      category, 
      severity, 
      description, 
      evidenceUrls, 
      requestedAmount,
      relatedEntityModel,
      relatedEntityId 
    } = body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Determine respondent
    let respondentId;
    if (session.role === "owner") {
      respondentId = property.tenantId; // The tenant
    } else if (session.role === "tenant") {
      respondentId = property.ownerId; // The owner
    }

    if (!respondentId) {
      return NextResponse.json({ error: "Cannot identify respondent for this property." }, { status: 400 });
    }

    const dispute = new Dispute({
      title,
      propertyId,
      initiatorId: session.id,
      initiatorModel: "User",
      respondentId,
      respondentModel: "User",
      category,
      severity: severity || "medium",
      status: "awaiting_respondent",
      relatedEntityModel,
      relatedEntityId,
      initiatorClaim: {
        description,
        evidenceUrls: evidenceUrls || [],
        requestedAmount: requestedAmount || 0,
        submittedAt: new Date()
      }
    });

    await dispute.save();

    // If it's linked to a payment, freeze it!
    if (relatedEntityModel === "Payment" && relatedEntityId) {
      await Payment.findByIdAndUpdate(relatedEntityId, {
         status: "disputed"
      });
    }

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("Create Dispute Error:", error);
    return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
  }
}
