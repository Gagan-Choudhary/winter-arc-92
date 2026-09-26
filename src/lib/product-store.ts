import { get } from "@vercel/blob";

export async function getProductBody(): Promise<BodyInit | null> {
  const productPath = process.env.PRODUCT_BLOB_PATH;
  if (!productPath) return null;
  const blob = await get(productPath, { access: "private" });
  return blob?.statusCode === 200 ? blob.stream : null;
}
