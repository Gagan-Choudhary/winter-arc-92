import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as files from "../src/lib/product-files.ts";
import * as security from "../src/lib/payment-security.ts";

const secret = "download-test-secret";
const paymentId = "pay_TEST123";
const receipt = { paymentId, status: "paid", productId: "winter-arc-92", amount: 4900, purchasedAt: Date.now() };

function loadModule(relativePath, dependencies, env) {
  const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const exports = {};
  const require = (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  new Function("require", "exports", "process", "console", outputText)(require, exports, { env }, { error() {} });
  return exports;
}

function route({ paidReceipt = receipt, body = "private product file", storageError = false } = {}) {
  const calls = [];
  const { GET } = loadModule("../src/app/api/download/route.ts", {
    "next/server": { NextResponse: Response },
    "@/lib/payment-security": security,
    "@/lib/product-files": files,
    "@/lib/payment-store": {
      PRODUCT_ID: "winter-arc-92", PRODUCT_PRICE_PAISE: 4900, privateStoreReady: () => true,
      getPaidReceipt: async (id) => { calls.push(["receipt", id]); return paidReceipt; },
    },
    "@/lib/product-store": {
      getProductBody: async (id) => { calls.push(["file", id]); if (storageError) throw new Error("storage failed"); return body; },
    },
  }, { DOWNLOAD_SIGNING_SECRET: secret });
  return { calls, request: (query) => GET({ nextUrl: new URL(`https://example.com/api/download?${query}`) }) };
}

function token() { return security.createDownloadToken(paymentId, secret, 900); }

test("each allowlisted file requires a signed token and paid receipt and returns correct download headers", async () => {
  for (const [id, file] of Object.entries(files.PRODUCT_FILES)) {
    const app = route();
    const response = await app.request(`token=${token()}&file=${id}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), file.contentType);
    assert.equal(response.headers.get("content-disposition"), `attachment; filename="${file.filename}"`);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(await response.text(), "private product file");
    assert.deepEqual(app.calls, [["receipt", paymentId], ["file", id]]);
  }
});

test("existing ZIP links without a file selector still work", async () => {
  const app = route();
  assert.equal((await app.request(`token=${token()}`)).status, 200);
  assert.deepEqual(app.calls.at(-1), ["file", "pack"]);
});

test("all file choices reject expired and tampered authorization before storage access", async () => {
  const expired = security.createDownloadToken(paymentId, secret, 900, Date.now() - 901000);
  const altered = token().replace(paymentId, "pay_OTHER");
  for (const file of Object.keys(files.PRODUCT_FILES)) {
    for (const invalid of [expired, altered, "invalid"]) {
      const app = route();
      assert.equal((await app.request(`token=${invalid}&file=${file}`)).status, 403);
      assert.deepEqual(app.calls, []);
    }
  }
});

test("file selectors cannot read arbitrary, old, or internal Blob objects", async () => {
  for (const value of ["", "__proto__", "constructor", "../payments/by-id/pay_TEST123.json", "products/Winter_Arc_92_Product_old.zip", "https://example.com/private.zip"]) {
    const app = route();
    assert.equal((await app.request(`token=${token()}&file=${encodeURIComponent(value)}`)).status, 400);
    assert.deepEqual(app.calls, []);
  }
});

test("ambiguous token or file parameters are rejected before storage access", async () => {
  for (const query of [`token=${token()}&file=dark&file=pack`, `token=${token()}&token=${token()}`, "file=dark"]) {
    const app = route();
    assert.equal((await app.request(query)).status, 400);
    assert.deepEqual(app.calls, []);
  }
});

test("no file is streamed without a valid product receipt", async () => {
  for (const paidReceipt of [null, { ...receipt, amount: 1 }, { ...receipt, productId: "another-product" }, { ...receipt, purchasedAt: undefined }]) {
    const app = route({ paidReceipt });
    assert.equal((await app.request(`token=${token()}&file=dark`)).status, 403);
    assert.deepEqual(app.calls, [["receipt", paymentId]]);
  }
});

test("missing or failed private Blob reads return a controlled unavailable response", async () => {
  for (const options of [{ body: null }, { storageError: true }]) {
    const app = route(options);
    assert.equal((await app.request(`token=${token()}&file=guide`)).status, 503);
  }
});

test("file storage uses exact private paths while preserving PRODUCT_BLOB_PATH for the ZIP", async () => {
  const calls = [];
  const { getProductBody } = loadModule("../src/lib/product-store.ts", {
    "@/lib/product-files": files,
    "@vercel/blob": { get: async (path, options) => { calls.push({ path, options }); return { statusCode: 200, stream: "body" }; } },
  }, { PRODUCT_BLOB_PATH: "custom/complete-pack.zip" });
  for (const [id, file] of Object.entries(files.PRODUCT_FILES)) {
    assert.equal(await getProductBody(id), "body");
    assert.deepEqual(calls.at(-1), {
      path: id === "pack" ? "custom/complete-pack.zip" : `products/${file.filename}`,
      options: { access: "private", useCache: false },
    });
  }
});
