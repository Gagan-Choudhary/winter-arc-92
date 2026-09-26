import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]{1,64}@[a-z0-9.-]+$/.test(email)) return null;
  const [local, domain] = email.split("@");
  if (local.includes("..") || local.startsWith(".") || local.endsWith(".")) return null;
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  if (labels.at(-1)!.length < 2) return null;
  return email;
}

export function normalizePhone(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  const phone = value.trim().replace(/[\s()-]/g, "");
  return /^\+?[0-9]{8,15}$/.test(phone) ? phone : null;
}

export function emailKey(email: string, secret: string): string {
  if (!secret) throw new Error("Missing entitlement hash secret");
  return createHmac("sha256", secret).update(email).digest("hex");
}

export function newNonce(): string {
  return randomBytes(20).toString("hex");
}

function sign(purpose: string, subject: string, expires: number, secret: string): string {
  if (!secret) throw new Error("Missing access token secret");
  return createHmac("sha256", secret).update(`${purpose}:${subject}:${expires}`).digest("hex");
}

function secureEqual(expected: string, supplied: string): boolean {
  if (!/^[a-fA-F0-9]{64}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}

export function createAccessToken(purpose: "magic" | "session", subject: string, ttlSeconds: number, secret: string, now = Date.now()): string {
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(subject)) throw new Error("Invalid token subject");
  const expires = Math.floor(now / 1000) + ttlSeconds;
  return `${subject}.${expires}.${sign(purpose, subject, expires, secret)}`;
}

export function verifyAccessToken(purpose: "magic" | "session", token: string, secret: string, now = Date.now()): string | null {
  const match = /^([a-f0-9]{40}|[a-f0-9]{64})\.([0-9]{10})\.([a-fA-F0-9]{64})$/.exec(token);
  if (!match || !secret || Number(match[2]) <= Math.floor(now / 1000)) return null;
  return secureEqual(sign(purpose, match[1], Number(match[2]), secret), match[3]) ? match[1] : null;
}
