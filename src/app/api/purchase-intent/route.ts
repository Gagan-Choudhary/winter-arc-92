import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { checkoutConfigurationIssues } from "@/lib/checkout-config";
import { emailKey } from "@/lib/customer-auth";
import { normalizeEmail, normalizePhone, purchaseIdFromAttempt } from "@/lib/customer-input";
import { getPurchaseByReference, PRODUCT_ID, PRODUCT_PRICE_PAISE, savePurchase } from "@/lib/payment-store";
import { createPaymentLink } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return NextResponse.json({ error: "Invalid request" }, { status: 413 });
  }
  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (input.mode === "recover") return NextResponse.json({ error: "Use the recovery form to request access." }, { status: 400 });
  const email = normalizeEmail(input.email);
  if (!email) return NextResponse.json({ field: "email", error: "Enter a valid email address." }, { status: 400 });
  const phone = normalizePhone(input.phone);
  if (phone === null) return NextResponse.json({ field: "phone", error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });

  const missing = checkoutConfigurationIssues("purchase");
  if (missing.length) {
    // Log configuration names only, never credentials or buyer details.
    console.error("Checkout configuration unavailable; missing:", missing.join(", "));
    return NextResponse.json({ error: "Checkout is temporarily unavailable" }, { status: 503 });
  }

  const key = emailKey(email, process.env.ENTITLEMENT_HASH_SECRET!);
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
