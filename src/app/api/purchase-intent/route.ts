import { NextRequest, NextResponse } from "next/server";
import { emailKey, normalizeEmail, normalizePhone } from "@/lib/customer-auth";
import { createAndSendMagicLink, mailReady } from "@/lib/mail";
import { privateStoreReady } from "@/lib/payment-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!privateStoreReady() || !mailReady() || !process.env.ENTITLEMENT_HASH_SECRET) {
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
