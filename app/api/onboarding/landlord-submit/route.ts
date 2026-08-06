import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import cloudinary from "@/lib/cloudinary";
import { getSessionUser } from "@/lib/auth-helper";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_at_least_32_characters_long";

async function generateToken(payload: any) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(tokenInput));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  return `${tokenInput}.${encodedSignature}`;
}

/**
 * Helper — Builds a room-by-item structure from a BHK count.
 * Used to pre-populate the Digital Witness inspection blueprint.
 */
function buildStructureFromBHK(bhk: number) {
  const base = [
    {
      roomName: "Hall",
      items: [
        { itemName: "Main Door", baselineCondition: "Good" },
        { itemName: "Flooring", baselineCondition: "Good" },
        { itemName: "Fan/Lights", baselineCondition: "Good" },
        { itemName: "Windows", baselineCondition: "Good" },
      ],
    },
    {
      roomName: "Kitchen",
      items: [
        { itemName: "Sink/Tap", baselineCondition: "Good" },
        { itemName: "Cabinets", baselineCondition: "Good" },
        { itemName: "Exhaust Fan", baselineCondition: "Good" },
        { itemName: "Platform", baselineCondition: "Good" },
      ],
    },
  ];

  const bathrooms = [
    {
      roomName: "Bathroom",
      items: [
        { itemName: "Toilet", baselineCondition: "Good" },
        { itemName: "Shower/Taps", baselineCondition: "Good" },
        { itemName: "Geyser", baselineCondition: "Good" },
        { itemName: "Door Latch", baselineCondition: "Good" },
      ],
    },
  ];

  const bedroomsCount = Math.max(1, Math.min(bhk, 4));

  for (let i = 1; i <= bedroomsCount; i++) {
    base.push({
      roomName: bedroomsCount === 1 ? "Bedroom" : `Bedroom ${i}`,
      items: [
        { itemName: "Door/Lock", baselineCondition: "Good" },
        { itemName: "Wardrobe", baselineCondition: "Good" },
        { itemName: "Flooring", baselineCondition: "Good" },
        { itemName: "Fan/AC", baselineCondition: "Good" },
      ],
    });

    bathrooms.push({
      roomName: bedroomsCount === 1 ? "Bathroom" : `Bathroom ${i}`,
      items: [
        { itemName: "Toilet", baselineCondition: "Good" },
        { itemName: "Shower/Taps", baselineCondition: "Good" },
        { itemName: "Geyser", baselineCondition: "Good" },
        { itemName: "Door Latch", baselineCondition: "Good" },
      ],
    });
  }

  // Remove duplicate "Bathroom" from the initial array (we add them per bedroom)
  return [...base, ...bathrooms.slice(1)];
}

/**
 * POST /api/onboarding/landlord-submit
 *
 * Combined Landlord KYC + Property listing submission.
 * - Uploads KYC ID document, ownership proof, and listing images to Cloudinary.
 * - Sets User.verificationStatus = "pending_verification"
 * - Creates Property with listingStatus = "pending_approval"
 *
 * Auth: owner only
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "owner" && session.role !== "pending")
      return NextResponse.json(
        { error: "Please sign in to submit a property listing" },
        { status: 403 }
      );

    const body = await request.json();
    const {
      // ── Step 1: Personal KYC
      kycFullName,
      kycPhone,
      idDocumentBase64,

      // ── Step 2: Property Details
      address,
      city,
      state,
      pincode,
      rentAmount,
      depositAmount,
      bhk,
      furnishing,
      amenities,
      description,
      listingImagesBase64,

      // ── New filter fields
      propertyType,
      totalFloors,
      floorNumber,
      petsAllowed,

      // ── Step 3: Ownership Proof
      ownershipProofBase64,

      // ── Geo fields (from Geoapify via frontend)
      latitude,
      longitude,
      formattedAddress,
    } = body;

    if (!address || !city || !rentAmount || !bhk) {
      return NextResponse.json(
        { error: "Address, City, Rent, and BHK are required" },
        { status: 400 }
      );
    }

    // ── Upload KYC Identity Document ────────────────────────────────────────
    let idDocumentUrl = "";
    if (idDocumentBase64) {
      const kycUpload = await cloudinary.uploader.upload(idDocumentBase64, {
        folder: "rentease/kyc_documents",
        resource_type: "auto",
      });
      idDocumentUrl = kycUpload.secure_url;
    }

    // ── Upload Ownership Proof (Deed / Tax Receipt) ─────────────────────────
    let ownershipProofUrl = "";
    if (ownershipProofBase64) {
      const deedUpload = await cloudinary.uploader.upload(ownershipProofBase64, {
        folder: "rentease/ownership_deeds",
        resource_type: "auto",
      });
      ownershipProofUrl = deedUpload.secure_url;
    }

    // ── Upload Listing Images ───────────────────────────────────────────────
    const uploadedListingImages: string[] = [];
    if (Array.isArray(listingImagesBase64) && listingImagesBase64.length > 0) {
      for (const imgBase64 of listingImagesBase64) {
        if (!imgBase64) continue;
        const imgUpload = await cloudinary.uploader.upload(imgBase64, {
          folder: "rentease/listing_photos",
        });
        uploadedListingImages.push(imgUpload.secure_url);
      }
    }

    // ── Build Property Structure from BHK ──────────────────────────────────
    const structure = buildStructureFromBHK(Number(bhk));

    // ── Update User KYC only if not already verified ────────────────────────
    const currentUser = await User.findById(session.id);
    if (currentUser && currentUser.verificationStatus !== "verified") {
      await User.findByIdAndUpdate(session.id, {
        verificationStatus: "pending_verification",
        hostStatus: "pending", // drives the Navbar state machine
        kycDetails: {
          fullName: kycFullName || currentUser.kycDetails?.fullName || "",
          phone: kycPhone || currentUser.kycDetails?.phone || "",
          idDocumentUrl: idDocumentUrl || currentUser.kycDetails?.idDocumentUrl || "",
          submittedAt: new Date(),
        },
      });
    }

    // ── Create Property in "Pending Approval" State ─────────────────────────
    try {
      await Property.collection.dropIndex("inviteCode_1");
    } catch {
      // Index already dropped or doesn't exist
    }

    const newProperty = await Property.create({
      ownerId: session.id,
      address: formattedAddress || address,
      city,
      state: state || "",
      pincode: pincode || "",
      // Save GeoJSON location if coordinates were provided
      ...(latitude && longitude
        ? {
            location: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)], // GeoJSON = [lng, lat]
            },
            formattedAddress: formattedAddress || address,
          }
        : {}),
      rentAmount: Number(rentAmount),
      depositAmount: Number(depositAmount) || 0,
      bhk: Number(bhk),
      furnishing: furnishing || "unfurnished",
      amenities: Array.isArray(amenities) ? amenities : [],
      description: description || "",
      listingImages: uploadedListingImages,
      ownershipProofUrl,
      structure,
      // New filter fields
      propertyType: propertyType || undefined,
      totalFloors: totalFloors ? Number(totalFloors) : undefined,
      floorNumber: floorNumber ? Number(floorNumber) : undefined,
      petsAllowed: petsAllowed === true || petsAllowed === "true",
      listingStatus: "pending_approval",
      status: "vacant",
      leaseStartDate: new Date(),
    });

    // Send email to owner confirming submission and 24-48h review timeline
    const sessionUser = await User.findById(session.id);
    if (sessionUser?.email) {
      const { sendOwnerOnboardingSubmittedEmail } = await import("@/lib/email");
      sendOwnerOnboardingSubmittedEmail(
        sessionUser.email,
        sessionUser.name || kycFullName || "Landlord",
        formattedAddress || address
      ).catch((err) => console.error("Landlord onboarding submitted email failed:", err));
    }

    return NextResponse.json(
      {
        message:
          "Submitted! Your KYC and property are under admin review. You will be notified once approved.",
        propertyId: newProperty._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("LANDLORD_SUBMIT_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
