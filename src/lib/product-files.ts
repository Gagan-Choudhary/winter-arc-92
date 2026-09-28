// This allowlist is the entire set of files included in a verified purchase.
// Request parameters must never be treated as Blob paths.
export const PRODUCT_FILES = {
  pack: { label: "Complete Pack", filename: "Winter_Arc_92_Product.zip", format: "ZIP", contentType: "application/zip" },
  dark: { label: "Dark Tracker", filename: "Winter Arc 92 - Dark.xlsx", format: "XLSX", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  light: { label: "Light Tracker", filename: "Winter Arc 92 - Light.xlsx", format: "XLSX", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  guide: { label: "Quick Start Guide", filename: "Quick Start Guide.pdf", format: "PDF", contentType: "application/pdf" },
  habits: { label: "Habit Ideas", filename: "Habit Ideas.pdf", format: "PDF", contentType: "application/pdf" },
} as const;

export type ProductFileId = keyof typeof PRODUCT_FILES;
export const INDIVIDUAL_FILE_IDS = ["dark", "light", "guide", "habits"] as const;

export function parseProductFile(value: string | null): ProductFileId | null {
  // Preserve existing emailed/bookmarked ZIP links, which have no file parameter.
  if (value === null) return "pack";
  return Object.prototype.hasOwnProperty.call(PRODUCT_FILES, value) ? value as ProductFileId : null;
}
