import { NextRequest, NextResponse } from "next/server";
import { checkoutConfigurationIssues } from "@/lib/checkout-config";
import { emailKey, normalizeEmail, normalizePhone } from "@/lib/customer-auth";
import { createAndSendMagicLink } from "@/lib/mail";
import { PRODUCT_ID, PRODUCT_PRICE_PAISE, savePurchase } from "@/lib/payment-store";
import { createPaymentLink } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
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

  const missing = checkoutConfigurationIssues(mode);
  if (missing.length) {
    // Log configuration names only, never credentials or buyer details.
    console.error("Checkout configuration unavailable; missing:", missing.join(", "));
    return NextResponse.json({ error: "Checkout is temporarily unavailable" }, { status: 503 });
  }

  const key = emailKey(email, process.env.ENTITLEMENT_HASH_SECRET!);
  if (mode === "recover") {
    try {
      await createAndSendMagicLink(email, key, "recover");
      return NextResponse.json({ message: "Check your email for a secure link to continue." }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("Unable to send recovery verification email", error);
      return NextResponse.json({ error: "We couldn't send the link. Please try again shortly." }, { status: 503 });
    }
  }

  try {
    const payment = await createPaymentLink(email, phone || undefined);
    await savePurchase({
      purchaseId: payment.purchaseId, paymentLinkId: payment.id, email, emailKey: key,
      phone: phone || undefined, amount: PRODUCT_PRICE_PAISE, productId: PRODUCT_ID,
      status: "pending", checkoutUrl: payment.shortUrl, createdAt: Date.now(),
    });
    return NextResponse.json({ checkoutUrl: payment.shortUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to create new checkout", error);
    return NextResponse.json({ error: "We couldn't start checkout. Please try again shortly." }, { status: 503 });
  }
}
