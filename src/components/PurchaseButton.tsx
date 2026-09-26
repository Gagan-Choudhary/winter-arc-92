"use client";
import { siteConfig, trackPurchaseClick } from "@/lib/config";

type Props = { label: string; location: string; className?: string };

export function PurchaseButton({ label, location, className = "" }: Props) {
  const classes = `purchase-button ${className}`;
  if (!siteConfig.checkoutUrl) return <span className={`${classes} cursor-not-allowed opacity-75`} aria-label="Checkout link coming soon" title="Checkout link coming soon">{label}<span aria-hidden="true">↗</span></span>;
  return <a className={classes} href={siteConfig.checkoutUrl} onClick={() => trackPurchaseClick(location)}>{label}<span aria-hidden="true">↗</span></a>;
}
