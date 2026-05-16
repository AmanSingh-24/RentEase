import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Property from "@/models/Property";
import { getSessionUser } from "@/lib/auth-helper";

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const session = await getSessionUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!session) return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    if (session.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!id) {
      return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
    }

    // Get the property to verify ownership
    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    
    // Verify the requester is the owner
    if (property.ownerId.toString() !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedProperty = await Property.findByIdAndDelete(id);

    if (!deletedProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Property removed from vault" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}