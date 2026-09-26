import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createDownloadToken, parsePaymentReturn, verifyDownloadToken, verifyPaymentReturn, verifyWebhookSignature } from "../src/lib/payment-security.ts";

const secret = "test-secret";
const paymentId = "pay_ABC123";
const linkId = "plink_ABC123";
const referenceId = "";

test("webhook verification requires exact raw body and correct signature", () => {
  const body = '{"event":"payment_link.paid"}';
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, signature, secret), true);
  assert.equal(verifyWebhookSignature(`${body} `, signature, secret), false);
  assert.equal(verifyWebhookSignature(body, "0".repeat(64), secret), false);
});

test("payment return must be signed and paid", () => {
  const signature = createHmac("sha256", secret).update(`${linkId}|${referenceId}|paid|${paymentId}`).digest("hex");
  const query = new URLSearchParams({
    razorpay_payment_id: paymentId,
    razorpay_payment_link_id: linkId,
    razorpay_payment_link_reference_id: referenceId,
    razorpay_payment_link_status: "paid",
    razorpay_signature: signature,
  });
  const result = parsePaymentReturn(query);
  assert.ok(result);
  assert.equal(verifyPaymentReturn(result, secret), true);
  assert.equal(verifyPaymentReturn({ ...result, status: "failed" }, secret), false);
  query.append("razorpay_payment_id", "pay_other");
  assert.equal(parsePaymentReturn(query), null);
});

test("download token rejects expiry and tampering", () => {
  const now = 1_800_000_000_000;
  const token = createDownloadToken(paymentId, secret, 900, now);
  assert.equal(verifyDownloadToken(token, secret, now), paymentId);
  assert.equal(verifyDownloadToken(token, secret, now + 900_000), null);
  assert.equal(verifyDownloadToken(token.replace(paymentId, "pay_OTHER"), secret, now), null);
});
