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
    } = body;

    // 1. Validate Template
    if (!PROPERTY_TEMPLATES[templateType]) {
      return NextResponse.json({ error: "Invalid Property Template selected." }, { status: 400 });
    }

    // 2. Upload Property Baseline Photos to Cloudinary
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

    // 3. GENERATE THE STRUCTURE (The DNA of the house)
    // We transform the flat template into the nested Mongoose structure
    const structure = PROPERTY_TEMPLATES[templateType].map((room) => ({
      roomName: room.roomName,
      items: room.items.map((item: string) => ({
        itemName: item,
        baselineCondition: "Good" // Default state until tenant inspects
      }))
    }));

    const inviteCode = `RE-${nanoid(4).toUpperCase()}`;

    // 4. Create the Property with the new Logic
    const newProperty = await Property.create({
      ownerId,
      address: formattedAddress || address,
      rentAmount: Number(rentAmount),
      depositAmount: Number(depositAmount),
      structure,
      maintenanceRules,
      exitPolicy,
      guidelines: typeof guidelines === 'string' ? guidelines.split(",").map((s: string) => s.trim()) : guidelines,
      images: uploadedImages,
      inviteCode,
      status: "vacant",
      leaseStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      // Save GeoJSON location if coordinates were provided by the map picker
      ...(latitude && longitude
        ? {
            location: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)], // GeoJSON = [lng, lat]
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