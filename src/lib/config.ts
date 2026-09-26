export function trackPurchaseClick(location: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("winterarc:purchase-click", { detail: { location } }));
}
