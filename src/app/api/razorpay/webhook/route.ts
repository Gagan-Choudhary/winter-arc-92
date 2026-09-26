import { NextRequest, NextResponse } from "next/server";
import { sendOptionalDownloadEmail } from "@/lib/delivery";
import { verifyWebhookSignature } from "@/lib/payment-security";
import { getPaidReceipt, privateStoreReady, savePaidReceipt } from "@/lib/payment-store";

export const runtime = "nodejs";

type Entity = Record<string, unknown>;

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const expectedLinkId = process.env.RAZORPAY_PAYMENT_LINK_ID;
  if (!secret || !expectedLinkId || !privateStoreReady()) {
    return NextResponse.json({ error: "Payment delivery is not configured" }, { status: 503 });
  }

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
  // Razorpay webhooks are account-wide. A valid event for another product is not an error.
  if (link?.id !== expectedLinkId) return NextResponse.json({ received: true });
  if (
    link.status !== "paid" || link.currency !== "INR" ||
    link.amount !== 4900 || link.amount_paid !== 4900 || link.accept_partial === true ||
    typeof payment?.id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(payment.id) ||
    payment.status !== "captured" || payment.captured !== true ||
    payment.amount !== 4900 || payment.currency !== "INR"
  ) {
    return NextResponse.json({ error: "Payment does not match this product" }, { status: 422 });
  }

  try {
    const existing = await getPaidReceipt(payment.id);
    if (existing) return NextResponse.json({ received: true });
    await savePaidReceipt({ paymentId: payment.id, paymentLinkId: expectedLinkId, paidAt: Date.now() });
    const customer = link.customer as Entity | undefined;
    try { await sendOptionalDownloadEmail(payment.id, customer?.email || payment.email); }
    catch (error) { console.error("Optional download email failed", error); }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unable to record verified payment", error);
    return NextResponse.json({ error: "Unable to record payment" }, { status: 503 });
  }
}
