import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// app/api/auth/login/route.ts
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await request.json();
    console.log("🔍 Login attempt for:", email); // DEBUG

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
    }

    if (user.password === "GOOGLE_AUTH_USER") {
       console.log("⚠️ Google user attempted manual login");
       return NextResponse.json({ error: "Please log in using Google for this account." }, { status: 401 });
    }

    // Check if password exists before comparing
    if (!password || !user.password) {
       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (!isPasswordCorrect) {
      console.log("❌ Incorrect password");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("✅ Login successful for:", user.name);
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        propertyId: user.propertyId || null,
        isOnboarded: user.isOnboarded || false
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("🔥 LOGIN_API_CRASH:", error); // Check your VS Code terminal for this!
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}