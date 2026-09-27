import { NextRequest, NextResponse } from "next/server";
import { mailReady, sendPurchaseConfirmationEmail } from "@/lib/mail";
import { mailConfigurationIssues } from "@/lib/checkout-config";
import { verifyWebhookSignature } from "@/lib/payment-security";
import { getPaidReceipt, getPurchaseByLink, privateStoreReady, saveEntitlement, savePaidReceipt, savePurchase } from "@/lib/payment-store";
import { matchesPaidPurchase } from "@/lib/payment-validation";

export const runtime = "nodejs";

type Entity = Record<string, unknown>;

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !privateStoreReady()) return NextResponse.json({ error: "Payment delivery is not configured" }, { status: 503 });
  const body = await request.text();
  if (Buffer.byteLength(body) > 128_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verifyWebhookSignature(body, request.headers.get("x-razorpay-signature") || "", secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Entity;
  try { event = JSON.parse(body) as Entity; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (event.event !== "payment_link.paid") return NextResponse.json({ received: true });

  const payload = event.payload as Entity | undefined;
  const link = (payload?.payment_link as Entity | undefined)?.entity as Entity | undefined;
  const payment = (payload?.payment as Entity | undefined)?.entity as Entity | undefined;
  if (typeof link?.id !== "string" || typeof payment?.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(payment.id)) {
    return NextResponse.json({ error: "Invalid payment payload" }, { status: 422 });
  }

  try {
    const purchase = await getPurchaseByLink(link.id);
    // Account-wide webhooks can include unrelated products.
    if (!purchase) return NextResponse.json({ received: true });
    if (!matchesPaidPurchase(purchase, link, payment)) {
      return NextResponse.json({ error: "Payment does not match this purchase" }, { status: 422 });
    }
    const existing = await getPaidReceipt(payment.id);
    if (existing) return NextResponse.json({ received: true });
    const paid = { ...purchase, status: "paid" as const, paymentId: payment.id, purchasedAt: Date.now() };
    await savePurchase(paid);
    await saveEntitlement(paid);
    await savePaidReceipt(paid);
    // Receipt and entitlement are durable before email; email failure never undoes payment.
    if (mailReady()) {
      try {
        await sendPurchaseConfirmationEmail(paid.email, paid.emailKey, payment.id);
        await savePaidReceipt({ ...paid, emailSentAt: Date.now() });
      } catch { console.error("Purchase confirmation email failed", { resendCallSucceeded: false }); }
    } else {
      console.error("Purchase confirmation email unavailable; issues:", mailConfigurationIssues().join(", "));
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unable to record verified payment", { errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Unable to record payment" }, { status: 503 });
  }
}
