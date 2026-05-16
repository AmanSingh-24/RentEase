import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

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

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { email, password } = await request.json();
    console.log("🔍 Login attempt for:", email);

    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: "No account found with this email." }, { status: 401 });
    }

    if (user.password === "GOOGLE_AUTH_USER") {
       return NextResponse.json({ error: "Please log in using Google for this account." }, { status: 401 });
    }

    if (!password || !user.password) {
       return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await generateToken({ id: user._id, email: user.email, role: user.role });

    const response = NextResponse.json({
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

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
    
  } catch (error: any) {
    console.error("🔥 LOGIN_API_CRASH:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}