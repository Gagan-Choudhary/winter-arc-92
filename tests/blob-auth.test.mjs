import assert from "node:assert/strict";
import test from "node:test";
import { privateStoreReady } from "../src/lib/payment-store.ts";

test("private Blob readiness requires the connected store and OIDC, not a static token", () => {
  const original = {
    store: process.env.BLOB_STORE_ID,
    oidc: process.env.VERCEL_OIDC_TOKEN,
    staticToken: process.env.BLOB_READ_WRITE_TOKEN,
  };

  try {
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    process.env.BLOB_READ_WRITE_TOKEN = "legacy-token";
    assert.equal(privateStoreReady(), false);

    process.env.BLOB_STORE_ID = "store_test";
    assert.equal(privateStoreReady(), false);

    process.env.VERCEL_OIDC_TOKEN = "test-oidc-token";
    delete process.env.BLOB_READ_WRITE_TOKEN;
    assert.equal(privateStoreReady(), true);
  } finally {
    for (const [name, value] of Object.entries({
      BLOB_STORE_ID: original.store,
      VERCEL_OIDC_TOKEN: original.oidc,
      BLOB_READ_WRITE_TOKEN: original.staticToken,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
