"use client";

import { FormEvent, useRef, useState } from "react";
import { normalizeEmail, normalizePhone } from "@/lib/customer-input";

export function PurchaseForm({ mode, status }: { mode: "purchase" | "recover"; status?: string }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [serverError, setServerError] = useState("");
  const busyRef = useRef(false);
  const attemptRef = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = mode === "purchase" ? normalizePhone(phone) : "";
    setEmailError(normalizedEmail ? "" : "Enter a valid email address.");
    setPhoneError(normalizedPhone !== null ? "" : "Enter a valid 10-digit Indian mobile number.");
    setServerError("");
    if (!normalizedEmail || normalizedPhone === null) return;

    setEmail(normalizedEmail);
    if (mode === "purchase") setPhone(normalizedPhone);
    busyRef.current = true;
    setBusy(true);
    try {
      if (mode === "purchase") attemptRef.current ||= crypto.randomUUID();
      const response = await fetch("/api/purchase-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, phone: normalizedPhone, mode, ...(mode === "purchase" ? { attemptId: attemptRef.current } : {}) }),
      });
      const result = await response.json() as { error?: string; field?: "email" | "phone"; checkoutUrl?: string };
      if (!response.ok) {
        if (result.field === "email") { setEmailError("Enter a valid email address."); return; }
        if (result.field === "phone") { setPhoneError("Enter a valid 10-digit Indian mobile number."); return; }
        throw new Error(result.error || "Please try again shortly.");
      }
      if (mode === "purchase") {
        if (!result.checkoutUrl) throw new Error("Checkout could not be opened. Please try again.");
        window.location.assign(result.checkoutUrl);
        return;
      }
      setSent(true);
    } catch (cause) {
      setServerError(cause instanceof Error ? cause.message : "Please try again shortly.");
    } finally { busyRef.current = false; setBusy(false); }
  }

  return <main className="success-page"><div className="success-panel purchase-panel">
    <a className="brand" href="/" aria-label="Winter Arc home"><span className="brand-star">✦</span> WINTER ARC <b>92</b></a>
    <p className="eyebrow">SECURE ACCESS</p>
    {sent ? <>
      <h1>Check your inbox.</h1>
      <p className="success-subtitle">If this email has a purchase, we’ll send a secure link. Check spam if you don’t see it soon.</p>
    </> : <>
      <h1>{mode === "recover" ? "Download again." : "Start your Winter Arc."}</h1>
      <p className="success-subtitle">{mode === "recover" ? "Enter the email you used to purchase Winter Arc 92." : "Enter your email to open your secure ₹49 checkout."}</p>
      {status === "expired" && <p className="form-message">That link expired. Request a fresh one below.</p>}
      {status === "notfound" && <p className="form-message">We couldn’t find a purchase for that verified email. You can start a new purchase.</p>}
      {status === "unavailable" && <p className="form-message">We couldn’t continue right now. Please try again.</p>}
      <form className="purchase-form" onSubmit={submit} noValidate>
        <label htmlFor="buyer-email">Email Address <span>REQUIRED</span></label>
        <input id="buyer-email" type="email" name="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(""); attemptRef.current = null; }} onBlur={() => setEmail(email.trim().toLowerCase())} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "buyer-email-error" : undefined} placeholder="you@example.com" />
        {emailError && <p className="form-message" id="buyer-email-error" role="alert">{emailError}</p>}
        {mode === "purchase" && <><label htmlFor="buyer-phone">Phone Number <span>OPTIONAL</span></label><input id="buyer-phone" type="tel" name="phone" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneError(""); attemptRef.current = null; }} onBlur={() => setPhone(normalizePhone(phone) ?? phone.trim())} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? "buyer-phone-error" : undefined} placeholder="Your phone number" />{phoneError && <p className="form-message" id="buyer-phone-error" role="alert">{phoneError}</p>}</>}
        {serverError && <p className="form-message" role="alert">{serverError}</p>}
        <button className="purchase-button" type="submit" disabled={busy}>{busy ? mode === "recover" ? "SENDING SECURE LINK…" : "OPENING CHECKOUT…" : mode === "recover" ? "GET MY DOWNLOAD" : "CONTINUE — ₹49"} <span aria-hidden="true">↗</span></button>
      </form>
    </>}
    <a className="success-home" href={mode === "recover" ? "/purchase" : "/purchase?mode=recover"}>{mode === "recover" ? "NEW HERE? GET WINTER ARC 92" : "ALREADY PURCHASED? DOWNLOAD AGAIN"}</a>
  </div></main>;
}
