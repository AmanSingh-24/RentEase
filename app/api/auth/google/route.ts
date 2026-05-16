import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

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
    const body = await request.json();
    const { name, email, uid } = body;

    if (!email || !uid) {
      return NextResponse.json({ error: "Missing Google auth data" }, { status: 400 });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email: email,
        firebaseUid: uid,
        role: "pending", 
        password: "GOOGLE_AUTH_USER" 
      });
      console.log("New Google user created:", email);
    }

    // 🔒 Generate Secure Runtime Session Token
    const token = await generateToken({ id: user._id, email: user.email, role: user.role });

    const response = NextResponse.json({ 
      message: "Sync successful", 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        propertyId: user.propertyId || null,
        isOnboarded: user.isOnboarded || false
      } 
    }, { status: 200 });

    // Inject Secure Browser Header Token Cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 days expiration tracking
    });

    return response;

  } catch (error: any) {
    console.error("GOOGLE_SYNC_ERROR:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}