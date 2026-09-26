import { createHmac, timingSafeEqual } from "node:crypto";

export type PaymentReturn = {
  paymentId: string;
  paymentLinkId: string;
  referenceId: string;
  status: string;
  signature: string;
};

const paymentIdPattern = /^pay_[A-Za-z0-9]+$/;

function matchesHmac(message: string, signature: string, secret: string): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(signature) || !secret) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  return matchesHmac(body, signature, secret);
}

export function parsePaymentReturn(params: URLSearchParams): PaymentReturn | null {
  const paymentId = params.get("razorpay_payment_id") || "";
  const paymentLinkId = params.get("razorpay_payment_link_id") || "";
  const referenceId = params.get("razorpay_payment_link_reference_id") || "";
  const status = params.get("razorpay_payment_link_status") || "";
  const signature = params.get("razorpay_signature") || "";
  if (!paymentIdPattern.test(paymentId) || !/^plink_[A-Za-z0-9]+$/.test(paymentLinkId)) return null;
  if (["razorpay_payment_id", "razorpay_payment_link_id", "razorpay_payment_link_status", "razorpay_signature"].some((key) => params.getAll(key).length !== 1)) return null;
  if (params.getAll("razorpay_payment_link_reference_id").length > 1) return null;
  return { paymentId, paymentLinkId, referenceId, status, signature };
}

export function verifyPaymentReturn(result: PaymentReturn, secret: string): boolean {
  if (result.status !== "paid") return false;
  return matchesHmac(
    `${result.paymentLinkId}|${result.referenceId}|${result.status}|${result.paymentId}`,
    result.signature,
    secret,
  );
}

export function createDownloadToken(paymentId: string, secret: string, ttlSeconds: number, now = Date.now()): string {
  if (!paymentIdPattern.test(paymentId) || !secret) throw new Error("Invalid download signing configuration");
  const expires = Math.floor(now / 1000) + ttlSeconds;
  const message = `winter-arc-download:v1:${paymentId}:${expires}`;
  const signature = createHmac("sha256", secret).update(message).digest("hex");
  return `${paymentId}.${expires}.${signature}`;
}

export function verifyDownloadToken(token: string, secret: string, now = Date.now()): string | null {
  const match = /^(pay_[A-Za-z0-9]+)\.([0-9]{10})\.([a-fA-F0-9]{64})$/.exec(token);
  if (!match || !secret || Number(match[2]) <= Math.floor(now / 1000)) return null;
  const message = `winter-arc-download:v1:${match[1]}:${match[2]}`;
  return matchesHmac(message, match[3], secret) ? match[1] : null;
}
