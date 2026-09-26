"use client";
import { useEffect, useState } from "react";
import { PurchaseButton } from "./PurchaseButton";

export function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero-purchase");
    const final = document.getElementById("final-cta");
    if (!hero || !final) return;
    let heroVisible = true;
    let finalVisible = false;
    const update = () => setVisible(!heroVisible && !finalVisible);
    const heroObserver = new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; update(); });
    const finalObserver = new IntersectionObserver(([entry]) => { finalVisible = entry.isIntersecting; update(); });
    heroObserver.observe(hero);
    finalObserver.observe(final);
    return () => { heroObserver.disconnect(); finalObserver.disconnect(); };
  }, []);
  if (!visible || dismissed) return null;
  return <aside className="sticky-cta md:hidden" aria-label="Quick purchase">
    <div className="min-w-0"><strong>WINTER ARC TRACKER</strong><span>₹49 <s>₹199</s></span></div>
    <PurchaseButton label="GET WINTER ARC 92 — ₹49" location="mobile-sticky" className="!min-h-10 !px-4 !text-[11px]" />
    <button type="button" className="sticky-close" aria-label="Close quick purchase bar" onClick={() => setDismissed(true)}>×</button>
  </aside>;
}
