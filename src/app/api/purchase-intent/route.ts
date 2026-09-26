import { NextRequest, NextResponse } from "next/server";
import { emailKey, normalizeEmail, normalizePhone } from "@/lib/customer-auth";
import { createAndSendMagicLink, mailReady } from "@/lib/mail";
import { privateStoreReady } from "@/lib/payment-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!privateStoreReady() || !mailReady() || !process.env.ENTITLEMENT_HASH_SECRET) {
    // Log names only; never log credentials, buyer input, or the OIDC token.
    const missing = [
      !process.env.BLOB_STORE_ID && "BLOB_STORE_ID",
      !process.env.VERCEL_OIDC_TOKEN && "VERCEL_OIDC_TOKEN",
      !process.env.RESEND_API_KEY && "RESEND_API_KEY",
      !process.env.DOWNLOAD_FROM_EMAIL && "DOWNLOAD_FROM_EMAIL",
      !process.env.ACCESS_TOKEN_SECRET && "ACCESS_TOKEN_SECRET",
      !process.env.ENTITLEMENT_HASH_SECRET && "ENTITLEMENT_HASH_SECRET",
    ].filter(Boolean);
    try {
      const site = new URL(process.env.SITE_URL || "");
      if (site.protocol !== "https:" && !(process.env.NODE_ENV === "development" && site.hostname === "localhost")) missing.push("SITE_URL (HTTPS required)");
    } catch { missing.push("SITE_URL (invalid or absent)"); }
    console.error("Checkout configuration unavailable; missing:", missing.join(", "));
    return NextResponse.json({ error: "Checkout is temporarily unavailable" }, { status: 503 });
  }
  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return NextResponse.json({ error: "Invalid request" }, { status: 413 });
  }
  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  if (!email || phone === null) return NextResponse.json({ error: "Enter a valid email and optional phone number" }, { status: 400 });
  const mode = input.mode === "recover" ? "recover" : "purchase";
  try {
    await createAndSendMagicLink(email, emailKey(email, process.env.ENTITLEMENT_HASH_SECRET), mode, phone || undefined);
    return NextResponse.json({ message: "Check your email for a secure link to continue." }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to send purchase verification email", error);
    return NextResponse.json({ error: "We couldn't send the link. Please try again shortly." }, { status: 503 });
  }
}
