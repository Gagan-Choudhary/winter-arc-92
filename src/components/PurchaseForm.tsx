"use client";

import { FormEvent, useState } from "react";

export function PurchaseForm({ mode, status }: { mode: "purchase" | "recover"; status?: string }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/purchase-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), phone: mode === "purchase" ? phone : "", mode }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Please try again shortly.");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again shortly.");
    } finally { setBusy(false); }
  }

  return <main className="success-page"><div className="success-panel purchase-panel">
    <a className="brand" href="/" aria-label="Winter Arc home"><span className="brand-star">✦</span> WINTER ARC <b>92</b></a>
    <p className="eyebrow">SECURE ACCESS</p>
    {sent ? <>
      <h1>Check your inbox.</h1>
      <p className="success-subtitle">We sent a secure link to continue. Check spam if you don’t see it soon.</p>
    </> : <>
      <h1>{mode === "recover" ? "Download again." : "Start your Winter Arc."}</h1>
      <p className="success-subtitle">{mode === "recover" ? "Enter the email you used to purchase Winter Arc 92." : "Enter your email to continue securely. New buyers pay ₹49 once."}</p>
      {status === "expired" && <p className="form-message">That link expired. Request a fresh one below.</p>}
      {status === "notfound" && <p className="form-message">We couldn’t find a purchase for that verified email. You can start a new purchase.</p>}
      {status === "unavailable" && <p className="form-message">We couldn’t continue right now. Please try again.</p>}
      <form className="purchase-form" onSubmit={submit}>
        <label htmlFor="buyer-email">Email Address <span>REQUIRED</span></label>
        <input id="buyer-email" type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        {mode === "purchase" && <><label htmlFor="buyer-phone">Phone Number <span>OPTIONAL</span></label><input id="buyer-phone" type="tel" name="phone" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Your phone number" /></>}
        {error && <p className="form-message" role="alert">{error}</p>}
        <button className="purchase-button" type="submit" disabled={busy}>{busy ? "SENDING SECURE LINK…" : mode === "recover" ? "GET MY DOWNLOAD" : "CONTINUE — ₹49"} <span aria-hidden="true">↗</span></button>
      </form>
    </>}
    <a className="success-home" href={mode === "recover" ? "/purchase" : "/purchase?mode=recover"}>{mode === "recover" ? "NEW HERE? GET WINTER ARC 92" : "ALREADY PURCHASED? DOWNLOAD AGAIN"}</a>
  </div></main>;
}
