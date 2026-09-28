import { get } from "@vercel/blob";
import { PRODUCT_FILES, type ProductFileId } from "@/lib/product-files";

export async function getProductBody(file: ProductFileId = "pack"): Promise<BodyInit | null> {
  const productPath = file === "pack" ? process.env.PRODUCT_BLOB_PATH : `products/${PRODUCT_FILES[file].filename}`;
  if (!productPath) return null;
  const blob = await get(productPath, { access: "private", useCache: false });
  return blob?.statusCode === 200 ? blob.stream : null;
}
