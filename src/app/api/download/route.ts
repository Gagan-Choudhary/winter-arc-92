import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/payment-security";
import { getPaidReceipt, privateStoreReady, PRODUCT_ID, PRODUCT_PRICE_PAISE } from "@/lib/payment-store";
import { getProductBody } from "@/lib/product-store";
import { parseProductFile, PRODUCT_FILES } from "@/lib/product-files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!process.env.DOWNLOAD_SIGNING_SECRET || !privateStoreReady()) return new NextResponse("Download unavailable", { status: 503 });
  const params = request.nextUrl.searchParams;
  const file = parseProductFile(params.get("file"));
  if (!file || params.getAll("file").length > 1 || params.getAll("token").length !== 1) {
    return new NextResponse("Invalid download request", { status: 400 });
  }
  const paymentId = verifyDownloadToken(request.nextUrl.searchParams.get("token") || "", process.env.DOWNLOAD_SIGNING_SECRET);
  if (!paymentId) return new NextResponse("Invalid or expired download link", { status: 403 });
  try {
    const receipt = await getPaidReceipt(paymentId);
    if (!receipt || receipt.productId !== PRODUCT_ID || receipt.amount !== PRODUCT_PRICE_PAISE || !receipt.purchasedAt) {
      return new NextResponse("Download not authorized", { status: 403 });
    }
    const body = await getProductBody(file);
    if (!body) return new NextResponse("Product file unavailable", { status: 503 });
    return new NextResponse(body, {
      headers: {
        "Content-Type": PRODUCT_FILES[file].contentType,
        "Content-Disposition": `attachment; filename="${PRODUCT_FILES[file].filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("Unable to deliver product", { file, errorName: error instanceof Error ? error.name : "UnknownError" });
    return new NextResponse("Download unavailable", { status: 503 });
  }
}
