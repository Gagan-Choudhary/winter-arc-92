import { createDownloadToken } from "@/lib/payment-security";

export const DOWNLOAD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function receiptIsActive(paidAt: number): boolean {
  return Number.isFinite(paidAt) && paidAt <= Date.now() && Date.now() - paidAt < DOWNLOAD_WINDOW_MS;
}

export function downloadPath(paymentId: string, ttlSeconds = 15 * 60): string {
  const token = createDownloadToken(paymentId, process.env.DOWNLOAD_SIGNING_SECRET || "", ttlSeconds);
  return `/api/download?token=${encodeURIComponent(token)}`;
}

export async function sendOptionalDownloadEmail(paymentId: string, email: unknown): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DOWNLOAD_FROM_EMAIL;
  const siteUrl = process.env.SITE_URL;
  if (!apiKey || !from || !siteUrl || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  const url = new URL(downloadPath(paymentId, 24 * 60 * 60), siteUrl).toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `winter-arc-${paymentId}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your Winter Arc Tracker download",
      text: `Payment successful. Your Winter Arc starts now.\n\nDownload your files (link expires in 24 hours): ${url}`,
    }),
  });
  if (!response.ok) throw new Error(`Download email failed with status ${response.status}`);
}
