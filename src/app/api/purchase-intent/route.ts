import { after, NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutConfigurationIssues } from "@/lib/checkout-config";
import { emailKey } from "@/lib/customer-auth";
import { normalizeEmail, normalizePhone, purchaseIdFromAttempt } from "@/lib/customer-input";
import { createAndSendMagicLink } from "@/lib/mail";
import { getEntitlement, getPurchaseByReference, PRODUCT_ID, PRODUCT_PRICE_PAISE, savePurchase } from "@/lib/payment-store";
import { createPaymentLink } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return NextResponse.json({ error: "Invalid request" }, { status: 413 });
  }
  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const mode = input.mode === "recover" ? "recover" : "purchase";
  const email = normalizeEmail(input.email);
  if (!email) return NextResponse.json({ field: "email", error: "Enter a valid email address." }, { status: 400 });
  const phone = mode === "purchase" ? normalizePhone(input.phone) : "";
  if (phone === null) return NextResponse.json({ field: "phone", error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });

  const missing = checkoutConfigurationIssues(mode);
  if (missing.length) {
    // Log configuration names only, never credentials or buyer details.
    console.error(`${mode === "recover" ? "Recovery" : "Checkout"} configuration unavailable; missing:`, missing.join(", "));
    return NextResponse.json({ error: mode === "recover" ? "We're unable to send your download link right now. Please try again shortly." : "Checkout is temporarily unavailable" }, { status: 503 });
  }

  const key = emailKey(email, process.env.ENTITLEMENT_HASH_SECRET!);
  if (mode === "recover") {
    try {
      const owned = await getEntitlement(key);
      if (owned) {
        after(async () => {
          try { await createAndSendMagicLink(owned.email, key, "recover"); }
          catch { console.error("Recovery email delivery failed; configuration present:", checkoutConfigurationIssues("recover").length === 0); }
        });
      }
      // The same response is returned whether a purchase exists or email delivery succeeds.
      return NextResponse.json({ message: "If this email has a purchase, we'll send a secure download link." }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      console.error("Recovery entitlement lookup failed; configuration present:", checkoutConfigurationIssues("recover").length === 0);
      return NextResponse.json({ error: "We're unable to send your download link right now. Please try again shortly." }, { status: 503 });
    }
  }

  try {
    const attemptId = input.attemptId === undefined ? randomUUID() : input.attemptId;
    const purchaseId = purchaseIdFromAttempt(attemptId);
    if (!purchaseId) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const previous = await getPurchaseByReference(purchaseId);
    if (previous) {
      if (previous.emailKey !== key || previous.status !== "pending" || Date.now() - previous.createdAt >= 30 * 60 * 1000) {
        return NextResponse.json({ error: "This checkout is no longer available. Refresh the page to try again." }, { status: 409 });
      }
      return NextResponse.json({ checkoutUrl: previous.checkoutUrl }, { headers: { "Cache-Control": "no-store" } });
    }
    const payment = await createPaymentLink(email, phone || undefined, purchaseId);
    await savePurchase({
      purchaseId: payment.purchaseId, paymentLinkId: payment.id, email, emailKey: key,
      phone: phone || undefined, amount: PRODUCT_PRICE_PAISE, productId: PRODUCT_ID,
      status: "pending", checkoutUrl: payment.shortUrl, createdAt: Date.now(),
    });
    return NextResponse.json({ checkoutUrl: payment.shortUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Checkout request failed; configuration present:", checkoutConfigurationIssues("purchase").length === 0);
    return NextResponse.json({ error: "We couldn't start checkout. Please try again shortly." }, { status: 503 });
  }
}
