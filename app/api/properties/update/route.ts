import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      propertyId,
      address,
      rentAmount,
      depositAmount,
      roomDetails,
      guidelines,
      latitude,
      longitude,
      formattedAddress,
    } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required for update" }, { status: 400 });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      {
        address: formattedAddress || address,
        rentAmount: Number(rentAmount),
        depositAmount: Number(depositAmount),
        roomDetails,
        guidelines: typeof guidelines === 'string' 
          ? guidelines.split(",").map((s: string) => s.trim()) 
          : guidelines,
        // Update geo location if new coordinates were provided
        ...(latitude && longitude
          ? {
              location: {
                type: "Point",
                coordinates: [Number(longitude), Number(latitude)],
              },
              formattedAddress: formattedAddress || address,
            }
          : {}),
      },
      { new: true }
    );

    return NextResponse.json({ message: "Property updated!", updatedProperty }, { status: 200 });
  } catch (error: any) {
    console.error("UPDATE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}