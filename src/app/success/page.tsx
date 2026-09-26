"use client";

import { useEffect, useState } from "react";

type State = "checking" | "paid" | "pending" | "invalid" | "expired" | "unavailable";

export default function SuccessPage() {
  const [state, setState] = useState<State>("checking");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const query = window.location.search;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      try {
        const response = await fetch(`/api/payment-status${query}`, { cache: "no-store" });
        const result = await response.json() as { state?: State; downloadUrl?: string; email?: string };
        if (cancelled) return;
        if (result.state === "paid" && result.downloadUrl) {
          setDownloadUrl(result.downloadUrl);
          setEmail(result.email || "");
          setState("paid");
        } else if (result.state === "pending" && attempts++ < 20) {
          setState("pending");
          timer = setTimeout(check, 3000);
        } else {
          setState(result.state || "unavailable");
        }
      } catch {
        if (!cancelled) setState("unavailable");
      }
    }

    void check();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  return <main className="success-page"><div className="success-panel">
    <a className="brand" href="/" aria-label="Winter Arc home"><span className="brand-star">✦</span> WINTER ARC <b>92</b></a>
    {state === "paid" ? <>
      <p className="eyebrow">PAYMENT CONFIRMED</p>
      <h1>Payment Successful</h1>
      <p className="success-subtitle">Your Winter Arc starts now.</p>
      <p className="access-email">Purchase linked to: <strong>{email}</strong></p>
      <a className="purchase-button" href={downloadUrl}>DOWNLOAD WINTER ARC 92 <span aria-hidden="true">↗</span></a>
      <p className="success-note">This download link expires in 15 minutes. You can request a fresh link by email whenever you need it.</p>
    </> : <>
      <p className="eyebrow">WINTER ARC TRACKER</p>
      <h1>{state === "checking" || state === "pending" ? "Confirming your payment" : state === "expired" ? "Download access expired" : state === "invalid" ? "Payment could not be verified" : "Download is temporarily unavailable"}</h1>
      <p className="success-subtitle">{state === "checking" || state === "pending" ? "We’re waiting for Razorpay to confirm your payment. This can take a moment." : state === "expired" ? "Request a fresh download link using your purchase email." : state === "invalid" ? "Use the return link from your completed Razorpay payment." : "Please refresh the page in a moment or contact support."}</p>
      {state === "pending" && <button className="success-retry" onClick={() => window.location.reload()}>CHECK AGAIN</button>}
      {state === "expired" && <a className="purchase-button" href="/purchase?mode=recover">GET MY DOWNLOAD <span aria-hidden="true">↗</span></a>}
    </>}
    <a className="success-home" href="/">BACK TO WINTER ARC</a>
  </div></main>;
}
