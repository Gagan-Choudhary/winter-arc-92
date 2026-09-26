import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/payment-security";
import { getPaidReceipt, privateStoreReady, PRODUCT_ID, PRODUCT_PRICE_PAISE } from "@/lib/payment-store";
import { getProductBody } from "@/lib/product-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!process.env.DOWNLOAD_SIGNING_SECRET || !privateStoreReady()) return new NextResponse("Download unavailable", { status: 503 });
  const paymentId = verifyDownloadToken(request.nextUrl.searchParams.get("token") || "", process.env.DOWNLOAD_SIGNING_SECRET);
  if (!paymentId) return new NextResponse("Invalid or expired download link", { status: 403 });
  try {
    const receipt = await getPaidReceipt(paymentId);
    if (!receipt || receipt.productId !== PRODUCT_ID || receipt.amount !== PRODUCT_PRICE_PAISE || !receipt.purchasedAt) {
      return new NextResponse("Download not authorized", { status: 403 });
    }
    const body = await getProductBody();
    if (!body) return new NextResponse("Product file unavailable", { status: 503 });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="Winter_Arc_92_Product.zip"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Unable to deliver product", error);
    return new NextResponse("Download unavailable", { status: 503 });
  }
}
