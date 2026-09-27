import assert from "node:assert/strict";
import test from "node:test";
import { privateStoreReady } from "../src/lib/payment-store.ts";

test("private Blob readiness requires a connected store and leaves OIDC to the SDK", () => {
  const original = process.env.BLOB_STORE_ID;

  try {
    delete process.env.BLOB_STORE_ID;
    assert.equal(privateStoreReady(), false);

    process.env.BLOB_STORE_ID = "store_test";
    assert.equal(privateStoreReady(), true);
  } finally {
    if (original === undefined) delete process.env.BLOB_STORE_ID;
    else process.env.BLOB_STORE_ID = original;
  }
});
