import { get } from "@vercel/blob";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { localPrivateStore } from "@/lib/payment-store";

export async function getProductBody(): Promise<BodyInit | null> {
  if (localPrivateStore()) {
    try {
      const bytes = await readFile(path.join(process.cwd(), "private", "Winter_Arc_92_Product.zip"));
      return new Uint8Array(bytes);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  const productPath = process.env.PRODUCT_BLOB_PATH;
  if (!productPath) return null;
  const blob = await get(productPath, { access: "private" });
  return blob?.statusCode === 200 ? blob.stream : null;
}
