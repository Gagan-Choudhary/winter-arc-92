import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as security from "../src/lib/payment-security.ts";
import { trackPageView, trackViewContent, trackInitiateCheckout, trackPurchase } from "../src/lib/meta-pixel.ts";

const pixelId = "123456789";

function browser(store = new Map(), fbq = () => {}) {
  globalThis.window = {
    fbq,
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  };
  return store;
}

test("Pixel calls are safe when not configured, blocked, or unavailable", () => {
  const original = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const calls = [];
  try {
    delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    browser(new Map(), (...args) => calls.push(args));
    assert.equal(trackPageView(), false);
    assert.equal(trackPurchase("pay_VALID123"), false);
    process.env.NEXT_PUBLIC_META_PIXEL_ID = pixelId;
    globalThis.window.fbq = undefined;
    assert.equal(trackViewContent(), false);
    assert.equal(trackPurchase("pay_VALID123"), false);
    globalThis.window.fbq = () => { throw new Error("blocked"); };
    assert.equal(trackInitiateCheckout(), false);
    assert.equal(trackPurchase("pay_VALID123"), false);
    assert.deepEqual(calls, []);
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    else process.env.NEXT_PUBLIC_META_PIXEL_ID = original;
    delete globalThis.window;
  }
});

test("standard events carry the product details and Purchase is stored once per verified payment ID", () => {
  const original = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const calls = [];
  const store = new Map();
  try {
    process.env.NEXT_PUBLIC_META_PIXEL_ID = pixelId;
    browser(store, (...args) => calls.push(args));
    assert.equal(trackPageView(), true);
    assert.equal(trackViewContent(), true);
    assert.equal(trackInitiateCheckout(), true);
    assert.equal(trackPurchase("from-url"), false);
    assert.equal(trackPurchase("pay_VALID123"), true);
    assert.equal(trackPurchase("pay_VALID123"), false);
    // A fresh page has a new Window but the same browser storage.
    browser(store, (...args) => calls.push(args));
    assert.equal(trackPurchase("pay_VALID123"), false);
    assert.equal(trackPurchase("pay_ANOTHER456"), true);
    assert.deepEqual(calls, [
      ["track", "PageView", undefined],
      ["track", "ViewContent", { content_name: "Winter Arc 92", value: 49, currency: "INR", content_type: "product" }],
      ["track", "InitiateCheckout", { content_name: "Winter Arc 92", value: 49, currency: "INR" }],
      ["track", "Purchase", { content_name: "Winter Arc 92", value: 49, currency: "INR" }, { eventID: "pay_VALID123" }],
      ["track", "Purchase", { content_name: "Winter Arc 92", value: 49, currency: "INR" }, { eventID: "pay_ANOTHER456" }],
    ]);
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
    else process.env.NEXT_PUBLIC_META_PIXEL_ID = original;
    delete globalThis.window;
  }
});

function loadStatusRoute({ receipt, entitlement }) {
  const source = readFileSync(new URL("../src/app/api/payment-status/route.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const exports = {};
  const dependencies = {
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
    "@/lib/delivery": { callbackIsActive: () => true, downloadPath: () => "/api/download?token=SIGNED" },
    "@/lib/payment-security": security,
    "@/lib/payment-store": {
      PRODUCT_PRICE_PAISE: 4900,
      privateStoreReady: () => true,
      getPaidReceipt: async () => receipt,
      getEntitlement: async () => entitlement,
    },
  };
  new Function("require", "exports", "process", "console", outputText)(
    (name) => { assert.ok(Object.hasOwn(dependencies, name), name); return dependencies[name]; },
    exports,
    { env: { RAZORPAY_KEY_SECRET: "test-razorpay-secret", DOWNLOAD_SIGNING_SECRET: "test-download-secret" } },
    { error() {} },
  );
  return exports.GET;
}

test("payment status exposes payment ID only after signed return, paid receipt, and matching entitlement", async () => {
  const paymentId = "pay_VALID123";
  const linkId = "plink_VALID123";
  const referenceId = "wa92_reference";
  const secret = "test-razorpay-secret";
  const signature = createHmac("sha256", secret).update(`${linkId}|${referenceId}|paid|${paymentId}`).digest("hex");
  const url = new URL("https://example.com/api/payment-status");
  for (const [key, value] of Object.entries({
    razorpay_payment_id: paymentId,
    razorpay_payment_link_id: linkId,
    razorpay_payment_link_reference_id: referenceId,
    razorpay_payment_link_status: "paid",
    razorpay_signature: signature,
  })) url.searchParams.set(key, value);
  const receipt = { paymentId, paymentLinkId: linkId, purchaseId: referenceId, email: "buyer@example.com", emailKey: "key", amount: 4900, purchasedAt: Date.now() };
  const request = { nextUrl: url };

  const noReceipt = await loadStatusRoute({ receipt: null, entitlement: receipt })(request);
  assert.deepEqual(await noReceipt.json(), { state: "pending" });
  const noEntitlement = await loadStatusRoute({ receipt, entitlement: null })(request);
  assert.deepEqual(await noEntitlement.json(), { state: "pending" });
  const wrongEntitlement = await loadStatusRoute({ receipt, entitlement: { ...receipt, paymentId: "pay_OTHER" } })(request);
  assert.deepEqual(await wrongEntitlement.json(), { state: "pending" });
  const paid = await loadStatusRoute({ receipt, entitlement: receipt })(request);
  assert.equal(paid.status, 200);
  assert.deepEqual(await paid.json(), { state: "paid", email: "buyer@example.com", paymentId, downloadUrl: "/api/download?token=SIGNED" });
  url.searchParams.set("razorpay_signature", "0".repeat(64));
  const invalid = await loadStatusRoute({ receipt, entitlement: receipt })(request);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { state: "invalid" });
});
