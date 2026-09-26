export const siteConfig = {
  checkoutUrl: process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim() || "",
};

export function trackPurchaseClick(location: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("winterarc:purchase-click", { detail: { location } }));
}
