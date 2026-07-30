import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";

/**
 * GET /api/properties/marketplace
 *
 * Public endpoint — no authentication required.
 * Returns only properties with listingStatus === "active_marketplace".
 * Sensitive owner contact info (phone, email) is NEVER returned.
 *
 * Query Params: city, pincode, bhk, minRent, maxRent, furnishing
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const city = searchParams.get("city");
    const pincode = searchParams.get("pincode");
    const bhk = searchParams.get("bhk");
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const furnishing = searchParams.get("furnishing");

    // Base filter — only approved marketplace listings
    const query: any = { listingStatus: "active_marketplace" };

    if (id) query._id = id;
    if (city) query.city = { $regex: city.trim(), $options: "i" };
    if (pincode) query.pincode = pincode.trim();
    if (bhk) query.bhk = Number(bhk);
    if (furnishing) query.furnishing = furnishing;
    if (minRent || maxRent) {
      query.rentAmount = {};
      if (minRent) query.rentAmount.$gte = Number(minRent);
      if (maxRent) query.rentAmount.$lte = Number(maxRent);
    }

    const properties = await Property.find(query)
      // Explicitly exclude sensitive internal fields
      .select(
        "-structure -agreement -maintenanceRules -exitPolicy -pastTenants -ownershipProofUrl -tenantId -activeExitId"
      )
      // Only expose owner name and verification badge — NO phone or email
      .populate("ownerId", "name verificationStatus")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ properties }, { status: 200 });
  } catch (error: any) {
    console.error("MARKETPLACE_FETCH_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
