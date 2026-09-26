"use client";
import { trackPurchaseClick } from "@/lib/config";

type Props = { label: string; location: string; className?: string };

export function PurchaseButton({ label, location, className = "" }: Props) {
  return <a className={`purchase-button ${className}`} href="/purchase" onClick={() => trackPurchaseClick(location)}>{label}<span aria-hidden="true">↗</span></a>;
}
