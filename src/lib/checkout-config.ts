export type CheckoutMode = "purchase" | "recover";

function validSender(value: string | undefined): boolean {
  if (!value) return false;
  const address = value.includes("<") ? /^(?:[^<>\r\n]+)\s<([^<>\s]+)>$/.exec(value)?.[1] : value;
  return Boolean(address && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address));
}

export function mailConfigurationIssues(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing = [
    !env.RESEND_API_KEY && "RESEND_API_KEY",
    !validSender(env.DOWNLOAD_FROM_EMAIL) && "DOWNLOAD_FROM_EMAIL (invalid or absent)",
    !env.ACCESS_TOKEN_SECRET && "ACCESS_TOKEN_SECRET",
  ].filter((value): value is string => Boolean(value));

  try {
    const site = new URL(env.SITE_URL || "");
    if (site.protocol !== "https:" && !(env.NODE_ENV === "development" && site.hostname === "localhost")) {
      missing.push("SITE_URL (HTTPS required)");
    }
  } catch { missing.push("SITE_URL (invalid or absent)"); }

  return missing;
}

export function checkoutConfigurationIssues(mode: CheckoutMode, env: NodeJS.ProcessEnv = process.env): string[] {
  const missing = [
    !env.BLOB_STORE_ID && "BLOB_STORE_ID",
    !env.ENTITLEMENT_HASH_SECRET && "ENTITLEMENT_HASH_SECRET",
  ].filter((value): value is string => Boolean(value));

  if (mode === "recover") return [...missing, ...mailConfigurationIssues(env)];

  return [
    ...missing,
    ...[
      !env.RAZORPAY_KEY_ID && "RAZORPAY_KEY_ID",
      !env.RAZORPAY_KEY_SECRET && "RAZORPAY_KEY_SECRET",
      !env.RAZORPAY_WEBHOOK_SECRET && "RAZORPAY_WEBHOOK_SECRET",
      !env.DOWNLOAD_SIGNING_SECRET && "DOWNLOAD_SIGNING_SECRET",
      !env.PRODUCT_BLOB_PATH && "PRODUCT_BLOB_PATH",
    ].filter((value): value is string => Boolean(value)),
  ];
}
