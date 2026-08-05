import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ExitProcess from "@/models/ExitProcess";



export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { exitId, photos } = body;

    // Deep Validation
    if (!exitId) return NextResponse.json({ error: "Missing Exit ID" }, { status: 400 });
    if (!photos || !Array.isArray(photos)) return NextResponse.json({ error: "Invalid photo array" }, { status: 400 });

    const formattedPhotos = photos.map((p: any) => ({
      area: p.area,
      url: p.url,
      comment: ""
    }));

    const updatedExit = await ExitProcess.findByIdAndUpdate(
      exitId,
      { $set: { moveOutPhotos: formattedPhotos, status: "photos_submitted" } },
      { returnDocument: 'after' }
    );

    if (!updatedExit) return NextResponse.json({ error: "Exit record not found in DB" }, { status: 404 });

    return NextResponse.json({ message: "Success", count: updatedExit.moveOutPhotos.length });
  } catch (error: any) {
    console.error("API_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}