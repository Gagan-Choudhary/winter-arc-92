import { randomUUID } from "node:crypto";
import { PRODUCT_PRICE_PAISE } from "@/lib/payment-store";

export type NewPaymentLink = { id: string; shortUrl: string; purchaseId: string };

export async function createPaymentLink(email: string, phone?: string, referenceId?: string): Promise<NewPaymentLink> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay API credentials are not configured");
  const purchaseId = referenceId || `wa92_${randomUUID().replace(/-/g, "")}`;
  if (!/^wa92_[a-f0-9]{32}$/.test(purchaseId)) throw new Error("Invalid purchase reference");
  const callback = process.env.RAZORPAY_CALLBACK_URL || "https://winterarctracker.vercel.app/success";
  const body = {
    amount: PRODUCT_PRICE_PAISE,
    currency: "INR",
    accept_partial: false,
    reference_id: purchaseId,
    description: "92-Day Excel Habit Tracker — Light + Dark Included",
    customer: { email, ...(phone ? { contact: phone } : {}) },
    notify: { email: false, sms: false },
    reminder_enable: false,
    expire_by: Math.floor(Date.now() / 1000) + 30 * 60,
    callback_url: callback,
    callback_method: "get",
  };
  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Razorpay payment link creation failed (${response.status})`);
  const result = await response.json() as { id?: unknown; short_url?: unknown };
  if (typeof result.id !== "string" || !/^plink_[A-Za-z0-9]+$/.test(result.id) || typeof result.short_url !== "string") {
    throw new Error("Razorpay returned an invalid payment link");
  }
  const url = new URL(result.short_url);
  if (url.protocol !== "https:" || !["rzp.io", "razorpay.com"].includes(url.hostname)) {
    throw new Error("Razorpay returned an unexpected payment URL");
  }
  return { id: result.id, shortUrl: url.toString(), purchaseId };
}
