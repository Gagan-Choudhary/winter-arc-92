import assert from "node:assert/strict";
import test from "node:test";
import { createAccessToken, emailKey, normalizeEmail, normalizePhone, verifyAccessToken } from "../src/lib/customer-auth.ts";

const secret = "test-access-token-secret-0123456789";

test("buyer identity is normalized and validated before storage", () => {
  assert.equal(normalizeEmail("  Customer+One@Example.COM  "), "customer+one@example.com");
  assert.equal(normalizeEmail("not an email"), null);
  assert.equal(normalizeEmail("a@bad..example"), null);
  assert.equal(normalizeEmail("a@bad-.example"), null);
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhone("call me"), null);
});

test("storage key hides the email and is keyed", () => {
  const key = emailKey("customer@example.com", "secret-one");
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.notEqual(key, emailKey("customer@example.com", "secret-two"));
});

test("magic links and owner sessions are purpose-bound and expire", () => {
  const now = 1_800_000_000_000;
  const nonce = "a".repeat(40);
  const token = createAccessToken("magic", nonce, 900, secret, now);
  assert.equal(verifyAccessToken("magic", token, secret, now), nonce);
  assert.equal(verifyAccessToken("session", token, secret, now), null);
  assert.equal(verifyAccessToken("magic", token, secret, now + 900_000), null);
  assert.equal(verifyAccessToken("magic", token.replace(nonce, "b".repeat(40)), secret, now), null);
  const ownerKey = "c".repeat(64);
  const session = createAccessToken("session", ownerKey, 1800, secret, now);
  assert.equal(verifyAccessToken("session", session, secret, now), ownerKey);
});
