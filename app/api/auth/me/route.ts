import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { cookies } from "next/headers";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_at_least_32_characters_long";

async function verifyToken(token: string) {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    
    const tokenInput = `${header}.${payload}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", 
      enc.encode(JWT_SECRET), 
      { name: "HMAC", hash: "SHA-256" }, 
      false, 
      ["verify"]
    );
    
    const sigBuf = Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(tokenInput));
    if (!isValid) return null;
    
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthenticated session token" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid identity credentials" }, { status: 401 });
    }

    // 🛡️ SECURITY DEFENSE: Guard against missing or corrupted payload IDs before querying
    if (!payload.id || !mongoose.Types.ObjectId.isValid(payload.id)) {
      console.error("⚠️ ME_API_WARNING: Decoded token payload has an invalid or missing user ID claim:", payload);
      return NextResponse.json({ error: "Malformed session authorization parameters" }, { status: 401 });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return NextResponse.json({ error: "User profile no longer exists in registry" }, { status: 404 });
    }

    return NextResponse.json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOnboarded: user.isOnboarded || false,
        propertyId: user.propertyId || null 
      } 
    }, { status: 200 });

  } catch (error: any) {
    // 🚨 DEBUG PROMPT: Always dump server exceptions to the terminal trace window
    console.error("🔥 ME_API_SYSTEM_CRASH:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}