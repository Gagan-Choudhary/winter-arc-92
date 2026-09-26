import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PaidReceipt = {
  paymentId: string;
  paymentLinkId: string;
  paidAt: number;
};

function receiptPath(paymentId: string): string {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new Error("Invalid payment ID");
  return `payment-receipts/${paymentId}.json`;
}

export function localPrivateStore(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.BLOB_READ_WRITE_TOKEN;
}

export function privateStoreReady(): boolean {
  return localPrivateStore() || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getPaidReceipt(paymentId: string): Promise<PaidReceipt | null> {
  if (localPrivateStore()) {
    try {
      const raw = await readFile(path.join(process.cwd(), "private", receiptPath(paymentId)), "utf8");
      return JSON.parse(raw) as PaidReceipt;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  const result = await get(receiptPath(paymentId), { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  const data: unknown = JSON.parse(await new Response(result.stream).text());
  if (!data || typeof data !== "object") return null;
  const receipt = data as Partial<PaidReceipt>;
  if (receipt.paymentId !== paymentId || typeof receipt.paymentLinkId !== "string" || typeof receipt.paidAt !== "number") return null;
  return receipt as PaidReceipt;
}

export async function savePaidReceipt(receipt: PaidReceipt): Promise<void> {
  if (localPrivateStore()) {
    const directory = path.join(process.cwd(), "private", "payment-receipts");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, `${receipt.paymentId}.json`), JSON.stringify(receipt), { flag: "wx" });
    return;
  }
  await put(receiptPath(receipt.paymentId), JSON.stringify(receipt), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}
