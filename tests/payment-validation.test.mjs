import assert from "node:assert/strict";
import test from "node:test";
import { matchesPaidPurchase } from "../src/lib/payment-validation.ts";

const purchase = { purchaseId: "wa92_123", paymentLinkId: "plink_ABC123", email: "buyer@example.com", amount: 4900, productId: "winter-arc-92" };
const link = { id: purchase.paymentLinkId, reference_id: purchase.purchaseId, status: "paid", currency: "INR", amount: 4900, amount_paid: 4900, accept_partial: false, customer: { email: "Buyer@Example.com" } };
const payment = { id: "pay_ABC123", status: "captured", captured: true, amount: 4900, currency: "INR" };

test("only the exact captured 49 rupee product purchase creates an entitlement", () => {
  assert.equal(matchesPaidPurchase(purchase, link, payment), true);
  assert.equal(matchesPaidPurchase(purchase, { ...link, amount_paid: 100 }, payment), false);
  assert.equal(matchesPaidPurchase(purchase, { ...link, reference_id: "other" }, payment), false);
  assert.equal(matchesPaidPurchase(purchase, { ...link, customer: { email: "other@example.com" } }, payment), false);
  assert.equal(matchesPaidPurchase(purchase, link, { ...payment, status: "failed", captured: false }), false);
  assert.equal(matchesPaidPurchase(purchase, link, { ...payment, amount: 100 }), false);
});
