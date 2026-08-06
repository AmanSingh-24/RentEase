import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import cloudinary from "@/lib/cloudinary";
import { nanoid } from "nanoid";

// ✅ MODULE 1: THE BLUEPRINT DEFINITION
const PROPERTY_TEMPLATES: Record<string, any[]> = {
  "1BHK": [
    { roomName: "Hall", items: ["Main Door", "Flooring", "Paint", "Fan/Lights", "Windows"] },
    { roomName: "Kitchen", items: ["Sink/Tap", "Cabinets", "Exhaust Fan", "Platform"] },
    { roomName: "Bedroom", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bathroom", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] }
  ],
  "2BHK": [
    { roomName: "Hall", items: ["Main Door", "Flooring", "Paint", "Fan/Lights", "Windows"] },
    { roomName: "Kitchen", items: ["Sink/Tap", "Cabinets", "Exhaust Fan", "Platform"] },
    { roomName: "Bedroom 1", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 2", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bathroom 1", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Bathroom 2", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Balcony", items: ["Railing", "Flooring", "Door/Latch"] }
  ],
  "3BHK": [
    { roomName: "Hall", items: ["Main Door", "Flooring", "Paint", "Fan/Lights", "Windows"] },
    { roomName: "Kitchen", items: ["Sink/Tap", "Cabinets", "Exhaust Fan", "Platform"] },
    { roomName: "Bedroom 1", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 2", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 3", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bathroom 1", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Bathroom 2", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Balcony 1", items: ["Railing", "Flooring"] },
    { roomName: "Balcony 2", items: ["Railing", "Flooring"] }
  ],
  "4BHK": [
    { roomName: "Hall", items: ["Main Door", "Flooring", "Paint", "Fan/Lights", "Windows"] },
    { roomName: "Kitchen", items: ["Sink/Tap", "Cabinets", "Exhaust Fan", "Platform"] },
    { roomName: "Bedroom 1", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 2", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 3", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 4", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bathroom 1", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Bathroom 2", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Bathroom 3", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Balcony", items: ["Railing", "Flooring"] }
  ],
  "Studio": [
    { roomName: "Living Studio Space", items: ["Main Door", "Flooring", "Paint", "Fan/AC", "Windows", "Kitchenette Sink", "Hotplate Setup"] },
    { roomName: "Bathroom", items: ["Toilet", "Shower/Taps", "Geyser", "Ventilation"] }
  ],
  "PG": [
    { roomName: "Shared Room Space", items: ["Beds/Mattress", "Study Desk", "Personal Wardrobe", "Flooring", "Lights/Fan"] },
    { roomName: "Common Washroom", items: ["Toilet", "Shower/Taps", "Geyser", "Mirror"] },
    { roomName: "Common Dining Room", items: ["Water Purifier", "Dining Table", "Refrigerator", "Microwave"] }
  ],
  "Villa": [
    { roomName: "Hall", items: ["Main Door", "Flooring", "Paint", "Fan/Lights", "Windows"] },
    { roomName: "Kitchen", items: ["Sink/Tap", "Cabinets", "Exhaust Fan", "Platform"] },
    { roomName: "Bedroom 1", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 2", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bedroom 3", items: ["Door/Lock", "Wardrobe", "Flooring", "Fan/AC"] },
    { roomName: "Bathroom 1", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Bathroom 2", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Bathroom 3", items: ["Toilet", "Shower/Taps", "Geyser", "Door Latch"] },
    { roomName: "Garage", items: ["Shutter/Gate", "Flooring", "Lights"] },
    { roomName: "Terrace", items: ["Flooring", "Water Tank", "Railing"] },
    { roomName: "Garden", items: ["Fence", "Lighting", "Landscaping"] }
  ]
};

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { 
      ownerId, 
      address, 
      rentAmount, 
      depositAmount, 
      templateType,
      maintenanceRules, 
      exitPolicy,
      guidelines, 
      images,
      latitude,
      longitude,
      formattedAddress,
      propertyType, // e.g. "apartment", "house", "villa", "studio", "pg"
      bhk, // Number
      furnishing, // "unfurnished", "semi_furnished", "fully_furnished"
    } = body;

    // 1. Validate Template
    if (!PROPERTY_TEMPLATES[templateType]) {
      return NextResponse.json({ error: "Invalid Property Template selected." }, { status: 400 });
    }

    // 2. Upload Property Deed/Proof to Cloudinary if provided
    let ownershipProofUrl = "";
    if (body.ownershipProof) {
      const result = await cloudinary.uploader.upload(body.ownershipProof, {
        folder: "rentease/deeds",
      });
      ownershipProofUrl = result.secure_url;
    }

    // 3. Upload Property Baseline Photos to Cloudinary
    const uploadedImages = await Promise.all(
      images.map(async (imgBase64: string) => {
        const result = await cloudinary.uploader.upload(imgBase64, {
          folder: "rentease/properties",
        });
        return {
          url: result.secure_url,
          isCameraCaptured: false,
          timestamp: new Date(),
        };
      })
    );

    // 4. GENERATE THE STRUCTURE (The DNA of the house)
    const structure = PROPERTY_TEMPLATES[templateType].map((room) => ({
      roomName: room.roomName,
      items: room.items.map((item: string) => ({
        itemName: item,
        baselineCondition: "Good"
      }))
    }));

    const inviteCode = `RE-${nanoid(4).toUpperCase()}`;

    // 5. Create the Property in "Pending Approval" State mapping to Landlord Onboarding flow
    const newProperty = await Property.create({
      ownerId,
      address: formattedAddress || address,
      rentAmount: Number(rentAmount),
      depositAmount: Number(depositAmount),
      bhk: bhk ? Number(bhk) : undefined,
      propertyType,
      furnishing,
      structure,
      maintenanceRules,
      exitPolicy,
      guidelines: typeof guidelines === 'string' ? guidelines.split(",").map((s: string) => s.trim()) : guidelines,
      images: uploadedImages,
      listingImages: uploadedImages.map(img => img.url), // Save string URLs to listingImages array for front-end rendering
      ownershipProofUrl, // Saved deed URL path
      inviteCode,
      status: "vacant",
      listingStatus: "pending_approval", // Restricts view in marketplace until approved by admin
      leaseStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      ...(latitude && longitude
        ? {
            location: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            formattedAddress: formattedAddress || address,
          }
        : {}),
    });

    return NextResponse.json({ 
      message: "Property Vault Created!", 
      inviteCode: newProperty.inviteCode 
    }, { status: 201 });

  } catch (error: any) {
    console.error("CREATE_PROPERTY_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}