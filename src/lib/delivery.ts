import { createDownloadToken } from "@/lib/payment-security";

export const CALLBACK_WINDOW_MS = 60 * 60 * 1000;

export function callbackIsActive(purchasedAt: number): boolean {
  return Number.isFinite(purchasedAt) && purchasedAt <= Date.now() && Date.now() - purchasedAt < CALLBACK_WINDOW_MS;
}

export function downloadPath(paymentId: string): string {
  const token = createDownloadToken(paymentId, process.env.DOWNLOAD_SIGNING_SECRET || "", 15 * 60);
  return `/api/download?token=${encodeURIComponent(token)}`;
}
