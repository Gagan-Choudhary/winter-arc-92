import { NextRequest, NextResponse } from "next/server";
import { downloadPath, receiptIsActive } from "@/lib/delivery";
import { parsePaymentReturn, verifyPaymentReturn } from "@/lib/payment-security";
import { getPaidReceipt, privateStoreReady } from "@/lib/payment-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function result(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const linkId = process.env.RAZORPAY_PAYMENT_LINK_ID;
  if (!secret || !linkId || !process.env.DOWNLOAD_SIGNING_SECRET || !privateStoreReady()) {
    return result({ state: "unavailable" }, 503);
  }
  const paymentReturn = parsePaymentReturn(request.nextUrl.searchParams);
  if (!paymentReturn || paymentReturn.paymentLinkId !== linkId || !verifyPaymentReturn(paymentReturn, secret)) {
    return result({ state: "invalid" }, 400);
  }
  try {
    const receipt = await getPaidReceipt(paymentReturn.paymentId);
    if (!receipt) return result({ state: "pending" }, 202);
    if (receipt.paymentLinkId !== linkId) return result({ state: "invalid" }, 403);
    if (!receiptIsActive(receipt.paidAt)) return result({ state: "expired" }, 410);
    return result({ state: "paid", downloadUrl: downloadPath(receipt.paymentId) }, 200);
  } catch (error) {
    console.error("Unable to check payment receipt", error);
    return result({ state: "unavailable" }, 503);
  }
}
