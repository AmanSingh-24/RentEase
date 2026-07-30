// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_at_least_32_characters_long";

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

    const sigBuf = Uint8Array.from(
      atob(signature.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuf,
      enc.encode(tokenInput)
    );
    if (!isValid) return null;

    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (
      decodedPayload.exp &&
      decodedPayload.exp < Math.floor(Date.now() / 1000)
    )
      return null;
    return decodedPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // ── OWNER DASHBOARD ──────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard-owner")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "owner" && payload.role !== "pending"))
      return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── TENANT DASHBOARD ─────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard-tenant")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "tenant" && payload.role !== "pending"))
      return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── PRE-ONBOARDING TENANT PAGES /dashboard/* ─────────────────────────────
  // These pages are for tenants who have been assigned a property but haven't
  // completed payment yet. They need to be authenticated but don't have propertyId.
  if (pathname.startsWith("/dashboard/")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "tenant" && payload.role !== "pending"))
      return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── ROLE SELECTION ───────────────────────────────────────────────────────
  if (pathname.startsWith("/role-selection")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "pending")
      return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── ADMIN CONTROL CENTER ─────────────────────────────────────────────────
  // Requires role === "admin". Any non-admin (including owners/tenants) gets
  // redirected to their dashboard or login.
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/login", request.url));
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "admin")
      return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── LANDLORD ONBOARDING (auth required, owner or pending role) ───────────
  if (pathname.startsWith("/onboarding/landlord")) {
    if (!token) return NextResponse.redirect(new URL("/login?redirect=/onboarding/landlord", request.url));
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== "owner" && payload.role !== "pending"))
      return NextResponse.redirect(new URL("/login", request.url));
  }

  // /properties/* and all other routes are PUBLIC — no auth enforced here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard-owner/:path*",
    "/dashboard-tenant/:path*",
    "/dashboard/:path*",
    "/role-selection/:path*",
    "/admin/:path*",
    "/onboarding/landlord/:path*",
  ],
};