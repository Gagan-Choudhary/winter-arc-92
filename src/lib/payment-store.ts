import { get, put } from "@vercel/blob";

export const PRODUCT_ID = "winter-arc-92" as const;
export const PRODUCT_PRICE_PAISE = 4900;

export type PurchaseRecord = {
  purchaseId: string;
  paymentLinkId: string;
  email: string;
  emailKey: string;
  phone?: string;
  amount: 4900;
  productId: typeof PRODUCT_ID;
  status: "pending" | "paid";
  checkoutUrl: string;
  createdAt: number;
  paymentId?: string;
  purchasedAt?: number;
};

export type MagicIntent = {
  nonce: string;
  email: string;
  emailKey: string;
  phone?: string;
  mode: "purchase" | "recover" | "delivery";
  expiresAt: number;
  checkoutUrl?: string;
};

const paymentIdPattern = /^pay_[A-Za-z0-9]+$/;
const linkIdPattern = /^plink_[A-Za-z0-9]+$/;
const emailKeyPattern = /^[a-f0-9]{64}$/;

async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return null;
  return JSON.parse(await new Response(result.stream).text()) as T;
}

async function writeJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export function privateStoreReady(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getIntent(nonce: string): Promise<MagicIntent | null> {
  if (!/^[a-f0-9]{40}$/.test(nonce)) return null;
  return readJson<MagicIntent>(`purchase-intents/${nonce}.json`);
}

export async function saveIntent(intent: MagicIntent): Promise<void> {
  if (!/^[a-f0-9]{40}$/.test(intent.nonce)) throw new Error("Invalid intent nonce");
  await writeJson(`purchase-intents/${intent.nonce}.json`, intent);
}

export async function getPurchaseByLink(paymentLinkId: string): Promise<PurchaseRecord | null> {
  if (!linkIdPattern.test(paymentLinkId)) return null;
  return readJson<PurchaseRecord>(`purchases/by-link/${paymentLinkId}.json`);
}

export async function savePurchase(record: PurchaseRecord): Promise<void> {
  if (!linkIdPattern.test(record.paymentLinkId)) throw new Error("Invalid link ID");
  await writeJson(`purchases/by-link/${record.paymentLinkId}.json`, record);
}

export async function getEntitlement(key: string): Promise<PurchaseRecord | null> {
  if (!emailKeyPattern.test(key)) return null;
  const record = await readJson<PurchaseRecord>(`entitlements/by-email/${key}.json`);
  return record?.status === "paid" && record.productId === PRODUCT_ID && record.emailKey === key ? record : null;
}

export async function saveEntitlement(record: PurchaseRecord): Promise<void> {
  if (!emailKeyPattern.test(record.emailKey) || record.status !== "paid") throw new Error("Invalid entitlement");
  await writeJson(`entitlements/by-email/${record.emailKey}.json`, record);
}

export async function getPaidReceipt(paymentId: string): Promise<PurchaseRecord | null> {
  if (!paymentIdPattern.test(paymentId)) return null;
  const record = await readJson<PurchaseRecord>(`payments/by-id/${paymentId}.json`);
  return record?.paymentId === paymentId && record.status === "paid" && record.productId === PRODUCT_ID ? record : null;
}

export async function savePaidReceipt(record: PurchaseRecord): Promise<void> {
  if (!record.paymentId || !paymentIdPattern.test(record.paymentId) || record.status !== "paid") throw new Error("Invalid paid receipt");
  await writeJson(`payments/by-id/${record.paymentId}.json`, record);
}
