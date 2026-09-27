// Shared by the browser form and API routes. Keep this module free of server-only imports.
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > 254 || !/^[^\s@]{1,64}@[a-z0-9.-]+$/.test(email)) return null;
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
  const phone = value.trim();
  if (!phone) return "";
  if (!/^\+?[0-9\s()-]+$/.test(phone) || (phone.match(/\+/g) || []).length > 1 || (phone.includes("+") && !phone.startsWith("+"))) return null;
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+") && !(digits.length === 12 && digits.startsWith("91"))) return null;
  const mobile = digits.length === 10 ? digits : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : "";
  if (!/^[6-9][0-9]{9}$/.test(mobile) || /^(\d)\1{9}$/.test(mobile)) return null;
  return `+91${mobile}`;
}

export function purchaseIdFromAttempt(value: unknown): string | null {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) return null;
  return `wa92_${value.replace(/-/g, "").toLowerCase()}`;
}
