import { NextRequest, NextResponse } from "next/server";
import { callbackIsActive, downloadPath } from "@/lib/delivery";
import { parsePaymentReturn, verifyPaymentReturn } from "@/lib/payment-security";
import { getEntitlement, getPaidReceipt, privateStoreReady, PRODUCT_PRICE_PAISE } from "@/lib/payment-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function result(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !process.env.DOWNLOAD_SIGNING_SECRET || !privateStoreReady()) return result({ state: "unavailable" }, 503);
  const callback = parsePaymentReturn(request.nextUrl.searchParams);
  if (!callback || !verifyPaymentReturn(callback, secret)) return result({ state: "invalid" }, 400);
  try {
    const receipt = await getPaidReceipt(callback.paymentId);
    if (!receipt) return result({ state: "pending" }, 202);
    if (receipt.paymentLinkId !== callback.paymentLinkId || receipt.purchaseId !== callback.referenceId) {
      return result({ state: "invalid" }, 403);
    }
    if (!receipt.purchasedAt || !callbackIsActive(receipt.purchasedAt)) return result({ state: "expired" }, 410);
    const entitlement = await getEntitlement(receipt.emailKey);
    if (!entitlement || entitlement.paymentId !== receipt.paymentId || receipt.amount !== PRODUCT_PRICE_PAISE) {
      return result({ state: "pending" }, 202);
    }
    return result({ state: "paid", email: receipt.email, paymentId: receipt.paymentId, downloadUrl: downloadPath(receipt.paymentId!) }, 200);
  } catch (error) {
    console.error("Unable to check payment receipt", error);
    return result({ state: "unavailable" }, 503);
  }
}
