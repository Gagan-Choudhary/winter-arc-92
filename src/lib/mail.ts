import { createAccessToken, newNonce } from "@/lib/customer-auth";
import { mailConfigurationIssues } from "@/lib/checkout-config";
import { MagicIntent, saveIntent } from "@/lib/payment-store";

export function mailReady(): boolean {
  return mailConfigurationIssues().length === 0;
}

async function sendMail(email: string, subject: string, text: string, url: string, idempotencyKey: string, buttonText: string, recoveryUrl?: string): Promise<void> {
  const expiry = recoveryUrl ? "24 hours" : "15 minutes";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.DOWNLOAD_FROM_EMAIL,
      to: [email],
      subject,
      text: `${text}\n\n${buttonText}: ${url}\n\nThis link expires in ${expiry}.${recoveryUrl ? `\n\nRecover your download later: ${recoveryUrl}` : ""}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:36px;background:#101116;color:#f5f5f5"><h1 style="font-size:28px">Winter Arc 92</h1><p>${text.replace(/\n/g, "<br>")}</p><p style="margin:32px 0"><a href="${url}" style="background:#38bdf8;color:#06121a;padding:14px 20px;border-radius:7px;text-decoration:none;font-weight:bold">${buttonText}</a></p><p style="font-size:12px;color:#a1a1aa">This link expires in ${expiry}. Both Light and Dark versions are included.</p>${recoveryUrl ? `<p style="font-size:12px"><a href="${recoveryUrl}" style="color:#38bdf8">Recover your download later</a></p>` : ""}</div>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Resend email failed (${response.status})`);
}

export async function createAndSendMagicLink(
  email: string,
  emailKey: string,
  mode: MagicIntent["mode"],
  phone?: string,
  purchaseId?: string,
): Promise<void> {
  if (!mailReady()) throw new Error("Email delivery is not configured");
  const nonce = newNonce();
  const ttl = mode === "delivery" ? 24 * 60 * 60 : 15 * 60;
  const intent: MagicIntent = { nonce, email, emailKey, phone, mode, expiresAt: Date.now() + ttl * 1000 };
  await saveIntent(intent);
  const token = createAccessToken("magic", nonce, ttl, process.env.ACCESS_TOKEN_SECRET || "");
  const url = new URL(`/api/verify?token=${encodeURIComponent(token)}`, process.env.SITE_URL).toString();
  if (mode === "delivery") {
    const recoveryUrl = new URL("/purchase?mode=recover", process.env.SITE_URL).toString();
    await sendMail(email, "Your Winter Arc 92 is ready ❄️", "Thank you for your purchase. Your Winter Arc 92 download is ready. Both Light and Dark versions are included.", url, `winter-arc-delivery-${purchaseId || nonce}`, "DOWNLOAD WINTER ARC 92", recoveryUrl);
  } else {
    await sendMail(email, "Continue with Winter Arc 92", "Use this secure link to continue. If you did not request it, you can ignore this email.", url, `winter-arc-verify-${nonce}`, "CONTINUE TO WINTER ARC");
  }
}
