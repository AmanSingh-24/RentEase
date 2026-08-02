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
 * Query Params:
 *   id, search, city, state, pincode,
 *   bhk, minRent, maxRent, furnishing,
 *   propertyType, totalFloors, floorNumber, petsAllowed
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const id           = searchParams.get("id");
    const search       = searchParams.get("search");       // full text search
    const city         = searchParams.get("city");
    const state        = searchParams.get("state");
    const pincode      = searchParams.get("pincode");
    const bhk          = searchParams.get("bhk");
    const minRent      = searchParams.get("minRent");
    const maxRent      = searchParams.get("maxRent");
    const furnishing   = searchParams.get("furnishing");
    const propertyType = searchParams.get("propertyType");
    const totalFloors  = searchParams.get("totalFloors");
    const floorNumber  = searchParams.get("floorNumber");
    const petsAllowed  = searchParams.get("petsAllowed");

    // Base filter — only approved marketplace listings
    const query: any = { listingStatus: "active_marketplace" };

    if (id)           query._id = id;

    // Search bar — matches address OR city (case-insensitive)
    if (search?.trim()) {
      const re = { $regex: search.trim(), $options: "i" };
      query.$or = [{ address: re }, { city: re }, { state: re }];
    }

    if (city)         query.city  = { $regex: city.trim(), $options: "i" };
    if (state)        query.state = { $regex: state.trim(), $options: "i" };
    if (pincode)      query.pincode = pincode.trim();
    if (bhk)          query.bhk = Number(bhk);
    if (furnishing)   query.furnishing = furnishing;
    if (propertyType) query.propertyType = propertyType;
    if (totalFloors)  query.totalFloors = Number(totalFloors);
    if (floorNumber)  query.floorNumber = Number(floorNumber);
    if (petsAllowed === "true")  query.petsAllowed = true;
    if (petsAllowed === "false") query.petsAllowed = false;

    if (minRent || maxRent) {
      query.rentAmount = {};
      if (minRent) query.rentAmount.$gte = Number(minRent);
      if (maxRent) query.rentAmount.$lte = Number(maxRent);
    }

    const properties = await Property.find(query)
      .select(
        "-structure -agreement -maintenanceRules -exitPolicy -pastTenants -ownershipProofUrl -tenantId -activeExitId"
      )
      .populate("ownerId", "name verificationStatus")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ properties }, { status: 200 });
  } catch (error: any) {
    console.error("MARKETPLACE_FETCH_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
