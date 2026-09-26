import { NextRequest, NextResponse } from "next/server";
import { createAccessToken, verifyAccessToken } from "@/lib/customer-auth";
import { getEntitlement, getIntent, PRODUCT_ID, PRODUCT_PRICE_PAISE, saveIntent, savePurchase } from "@/lib/payment-store";
import { createPaymentLink } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(target: string | URL) {
  return NextResponse.redirect(target, {
    status: 303,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

export async function GET(request: NextRequest) {
  const site = process.env.SITE_URL || request.url;
  const nonce = verifyAccessToken("magic", request.nextUrl.searchParams.get("token") || "", process.env.ACCESS_TOKEN_SECRET || "");
  const invalid = () => redirect(new URL("/purchase?status=expired", site));
  if (!nonce) return invalid();
  try {
    const intent = await getIntent(nonce);
    if (!intent || intent.nonce !== nonce || intent.expiresAt <= Date.now()) return invalid();
    const owned = await getEntitlement(intent.emailKey);
    if (owned) {
      const response = redirect(new URL("/access", site));
      response.cookies.set("wa92-access", createAccessToken("session", intent.emailKey, 30 * 60, process.env.ACCESS_TOKEN_SECRET || ""), {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 60,
      });
      return response;
    }
    if (intent.mode !== "purchase") return redirect(new URL("/purchase?mode=recover&status=notfound", site));
    if (intent.checkoutUrl) return redirect(intent.checkoutUrl);
    const payment = await createPaymentLink(intent.email, intent.phone);
    await savePurchase({
      purchaseId: payment.purchaseId, paymentLinkId: payment.id, email: intent.email,
      emailKey: intent.emailKey, phone: intent.phone, amount: PRODUCT_PRICE_PAISE,
      productId: PRODUCT_ID, status: "pending", checkoutUrl: payment.shortUrl, createdAt: Date.now(),
    });
    await saveIntent({ ...intent, checkoutUrl: payment.shortUrl });
    return redirect(payment.shortUrl);
  } catch (error) {
    console.error("Unable to continue verified purchase", error);
    return redirect(new URL("/purchase?status=unavailable", site));
  }
}
