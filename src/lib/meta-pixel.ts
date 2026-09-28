type PixelEvent = "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";
type PixelProperties = { content_name: "Winter Arc 92"; value: 49; currency: "INR"; content_type?: "product" };
type Fbq = (command: "track", event: PixelEvent, properties?: PixelProperties, options?: { eventID: string }) => void;

declare global {
  interface Window { fbq?: Fbq }
}

const product = { content_name: "Winter Arc 92", value: 49, currency: "INR" } as const;

function pixel(): Fbq | null {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID || typeof window === "undefined") return null;
  return typeof window.fbq === "function" ? window.fbq : null;
}

function track(event: PixelEvent, properties?: PixelProperties): boolean {
  const fbq = pixel();
  if (!fbq) return false;
  try { fbq("track", event, properties); return true; }
  catch { return false; }
}

export function trackPageView(): boolean { return track("PageView"); }
export function trackViewContent(): boolean { return track("ViewContent", { ...product, content_type: "product" }); }
export function trackInitiateCheckout(): boolean { return track("InitiateCheckout", product); }

export function trackPurchase(paymentId: string): boolean {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return false;
  const fbq = pixel();
  if (!fbq) return false;
  try {
    // Persist per verified payment so refreshes and repeat visits do not count twice.
    const key = `winter-arc:meta-purchase:${paymentId}`;
    if (window.localStorage.getItem(key)) return false;
    window.localStorage.setItem(key, "1");
    fbq("track", "Purchase", product, { eventID: paymentId });
    return true;
  } catch { return false; }
}
