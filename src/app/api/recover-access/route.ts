import { after, NextRequest, NextResponse } from "next/server";
import { checkoutConfigurationIssues } from "@/lib/checkout-config";
import { emailKey } from "@/lib/customer-auth";
import { normalizeEmail } from "@/lib/customer-input";
import { sendRecoveryEmail } from "@/lib/mail";
import { getEntitlement } from "@/lib/payment-store";

export const runtime = "nodejs";
export const maxDuration = 30;

const message = "If a purchase exists for this email, we've sent a secure access link.";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return NextResponse.json({ error: "Invalid request" }, { status: 413 });
  }
  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const email = normalizeEmail(input.email);
  if (!email) return NextResponse.json({ field: "email", error: "Enter a valid email address." }, { status: 400 });

  const missing = checkoutConfigurationIssues("recover");
  console.info("Recovery configuration", {
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasDownloadFromEmail: Boolean(process.env.DOWNLOAD_FROM_EMAIL),
    hasAccessTokenSecret: Boolean(process.env.ACCESS_TOKEN_SECRET),
    hasSiteUrl: Boolean(process.env.SITE_URL),
    hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
    hasEntitlementHashSecret: Boolean(process.env.ENTITLEMENT_HASH_SECRET),
    configurationValid: missing.length === 0,
  });
  if (missing.length) {
    console.error("Recovery configuration unavailable; issues:", missing.join(", "));
    return NextResponse.json({ error: "We're unable to send your download link right now. Please try again shortly." }, { status: 503 });
  }

  try {
    const key = emailKey(email, process.env.ENTITLEMENT_HASH_SECRET!);
    const owned = await getEntitlement(key);
    console.info("Recovery entitlement lookup", { entitlementFound: Boolean(owned) });
    if (owned) {
      after(async () => {
        try { await sendRecoveryEmail(owned.email, key); }
        catch { console.error("Recovery email delivery failed", { resendCallSucceeded: false }); }
      });
    }
    return NextResponse.json({ message }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Recovery entitlement lookup failed");
    return NextResponse.json({ error: "We're unable to send your download link right now. Please try again shortly." }, { status: 503 });
  }
}
