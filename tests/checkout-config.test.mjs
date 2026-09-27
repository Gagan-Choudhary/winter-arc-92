import assert from "node:assert/strict";
import test from "node:test";
import { checkoutConfigurationIssues } from "../src/lib/checkout-config.ts";

const readyPurchase = {
  BLOB_STORE_ID: "store_test",
  ENTITLEMENT_HASH_SECRET: "entitlement-secret",
  RAZORPAY_KEY_ID: "rzp_test_123",
  RAZORPAY_KEY_SECRET: "razorpay-secret",
  RAZORPAY_WEBHOOK_SECRET: "webhook-secret",
  DOWNLOAD_SIGNING_SECRET: "download-secret",
  PRODUCT_BLOB_PATH: "products/Winter_Arc_92_Product.zip",
};

test("new checkout does not require mail or access-token configuration", () => {
  assert.deepEqual(checkoutConfigurationIssues("purchase", readyPurchase), []);
  assert.deepEqual(checkoutConfigurationIssues("recover", readyPurchase), [
    "RESEND_API_KEY", "DOWNLOAD_FROM_EMAIL (invalid or absent)", "ACCESS_TOKEN_SECRET", "SITE_URL (invalid or absent)",
  ]);
});

test("recovery accepts a named sender and rejects a malformed address", () => {
  const readyRecovery = {
    ...readyPurchase,
    RESEND_API_KEY: "test-key",
    DOWNLOAD_FROM_EMAIL: "Winter Arc 92 <support@example.com>",
    ACCESS_TOKEN_SECRET: "access-secret",
    SITE_URL: "https://winterarctracker.vercel.app",
  };
  assert.deepEqual(checkoutConfigurationIssues("recover", readyRecovery), []);
  assert.deepEqual(checkoutConfigurationIssues("recover", { ...readyRecovery, DOWNLOAD_FROM_EMAIL: "Winter Arc 92" }), ["DOWNLOAD_FROM_EMAIL (invalid or absent)"]);
});

test("new checkout requires payment, private storage, and delivery configuration", () => {
  assert.deepEqual(checkoutConfigurationIssues("purchase", {}), [
    "BLOB_STORE_ID", "ENTITLEMENT_HASH_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET", "DOWNLOAD_SIGNING_SECRET", "PRODUCT_BLOB_PATH",
  ]);
});
