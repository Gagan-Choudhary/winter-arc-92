import { Resend } from "resend";
import { createAccessToken, newNonce } from "@/lib/customer-auth";
import { mailConfigurationIssues } from "@/lib/checkout-config";
import { MagicIntent, saveIntent } from "@/lib/payment-store";

const LINK_TTL_SECONDS = 15 * 60;

export function mailReady(): boolean {
  return mailConfigurationIssues().length === 0;
}

function safeErrorMessage(message: string): string {
  return message.slice(0, 240)
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:re_|pay_|plink_)[A-Za-z0-9_-]+\b/g, "[id]")
    .replace(/\b[A-Za-z0-9_-]{40,}\b/g, "[value]");
}

function emailHtml(copy: string, url: string, button: string, footer = ""): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;background:#101116;color:#f5f5f5"><h1 style="font-size:27px;margin:0 0 24px">Winter Arc 92</h1><p style="font-size:16px;line-height:1.6">${copy}</p><p style="margin:32px 0"><a href="${url}" style="display:inline-block;background:#38bdf8;color:#06121a;padding:14px 20px;border-radius:7px;text-decoration:none;font-weight:bold">${button}</a></p><p style="font-size:12px;color:#a1a1aa">This secure link expires in 15 minutes.</p>${footer}</div>`;
}

async function sendMail(email: string, subject: string, plain: string, htmlCopy: string, url: string, button: string, idempotencyKey: string, footer = ""): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  console.info("Resend email", { resendCallAttempted: true });
  let result: Awaited<ReturnType<typeof resend.emails.send>>;
  try {
    result = await resend.emails.send({
      from: process.env.DOWNLOAD_FROM_EMAIL!,
      to: [email],
      subject,
      text: `${plain}\n\n${button}: ${url}\n\nThis secure link expires in 15 minutes.${footer ? "\n\nKeep this email safe. If you need another link, use Download again on the website." : ""}`,
      html: emailHtml(htmlCopy, url, button, footer),
    }, { idempotencyKey });
  } catch (cause) {
    console.error("Resend request failed", {
      resendCallSucceeded: false,
      resendStatusCode: null,
      resendErrorName: cause instanceof Error ? cause.name : "UnknownError",
      resendErrorMessage: cause instanceof Error ? safeErrorMessage(cause.message) : "Request failed",
    });
    throw new Error("Email delivery failed");
  }
  const { data, error } = result;
  if (error || !data?.id) {
    console.error("Resend email rejected", {
      resendCallSucceeded: false,
      resendStatusCode: error && "statusCode" in error ? error.statusCode : undefined,
      resendErrorName: error?.name,
      resendErrorMessage: error?.message ? safeErrorMessage(error.message) : "No email id returned",
    });
    throw new Error("Email delivery failed");
  }
  console.info("Resend email accepted", { resendCallSucceeded: true });
}

async function createMagicLink(email: string, emailKey: string, mode: MagicIntent["mode"]): Promise<string> {
  if (!mailReady()) throw new Error("Email delivery is not configured");
  const nonce = newNonce();
  await saveIntent({ nonce, email, emailKey, mode, expiresAt: Date.now() + LINK_TTL_SECONDS * 1000 });
  const token = createAccessToken("magic", nonce, LINK_TTL_SECONDS, process.env.ACCESS_TOKEN_SECRET!);
  return new URL(`/api/verify?token=${encodeURIComponent(token)}`, process.env.SITE_URL).toString();
}

export async function sendRecoveryEmail(email: string, emailKey: string): Promise<void> {
  const url = await createMagicLink(email, emailKey, "recover");
  const copy = "Use this secure link to access your Winter Arc 92 files. If you did not request it, you can ignore this email.";
  await sendMail(email, "Your Winter Arc 92 access link", copy, copy, url, "ACCESS WINTER ARC 92", `winter-arc-recover-${newNonce()}`);
}

export async function sendPurchaseConfirmationEmail(email: string, emailKey: string, paymentId: string): Promise<void> {
  const url = await createMagicLink(email, emailKey, "delivery");
  const recoveryUrl = new URL("/purchase?mode=recover", process.env.SITE_URL).toString();
  const plain = "Hi,\n\nYour Winter Arc 92 purchase is confirmed.\nYour 92-day discipline journey starts now.";
  const htmlCopy = "Hi,<br><br>Your Winter Arc 92 purchase is confirmed.<br>Your 92-day discipline journey starts now.";
  const footer = `<p style="font-size:12px;color:#a1a1aa">Keep this email safe. Need another link later? <a href="${recoveryUrl}" style="color:#38bdf8">Download again</a>.</p><p style="font-size:12px;color:#a1a1aa">— Winter Arc 92</p>`;
  await sendMail(email, "Your Winter Arc 92 is ready", plain, htmlCopy, url, "ACCESS WINTER ARC 92", `winter-arc-delivery-${paymentId}`, footer);
}
