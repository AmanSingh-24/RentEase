// app/api/auth/update-role/route.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-helper"; // ✅ Secure session helper import

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

    // 🔒 Secure Fix: Read identity claims from the session cookie instead of trusting client body payloads
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized session access" }, { status: 401 });
    }

    const { role } = await request.json();
    if (!role || (role !== "owner" && role !== "tenant")) {
      return NextResponse.json({ error: "Invalid identity role selection format" }, { status: 400 });
    }

    // Update using verified session ID and clean up deprecation warning flags
    const user = await User.findByIdAndUpdate(
      session.id,
      { role },
      { returnDocument: "after" } // ✅ Fixes the Mongoose findOneAndUpdate deprecation warning log
    );

    if (!user) {
      return NextResponse.json({ error: "User profile context missing from database" }, { status: 404 });
    }

    // 🔄 Re-sign token cookie to match upgraded access layer parameters
    const newToken = await generateToken({ id: user._id, email: user.email, role: user.role });

    const response = NextResponse.json({ message: "Role updated successfully", role: user.role });
    
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error: any) {
    console.error("🔥 ROLE_UPDATE_API_CRASH:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}