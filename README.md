# Winter Arc 92 landing page

Next.js 15, TypeScript, and Tailwind CSS landing page based on the supplied visual references.

## Run locally

1. Run `npm.cmd install` in this folder.
2. Copy `.env.example` to `.env.local`. For Blob access, connect the private store to the Development environment and run `vercel env pull` while logged in with the Vercel CLI. This supplies `BLOB_STORE_ID` and an OIDC token; the SDK refreshes local tokens using your CLI credentials.
3. Run `npm.cmd run dev` and open the local URL shown in the terminal.
4. Run `npm.cmd run typecheck` and `npm.cmd run build` before deployment.

## Product screenshots

The site uses the supplied Winter Arc 92 screenshots, copied from `G:\Projects\WinterArCImages` into `public/images`:

- `dark-dashboard.png` in the hero, cropped in CSS to show the score, streaks, chart, and top habits.
- `light-dashboard.png` in the analytics preview card.
- `light-tracker.png` in the daily tracker card and Light theme comparison.
- `dark-tracker.png` in the Dark theme comparison.

The screenshot previews link to full-size originals. Next.js optimizes the displayed images. Change the preview crop in `src/app/globals.css` if the source images change.

## Launch configuration

All purchase buttons open `/purchase`. A new buyer enters an email and optionally an Indian mobile number; `POST /api/purchase-intent` normalizes both, creates a fresh ₹49 Razorpay Payment Link, saves a pending purchase in the private Blob store, and sends the buyer to Razorpay. A purchase-attempt ID reuses the same pending checkout on retry. New checkout does not require Resend. Returning buyers use `/purchase?mode=recover` and `POST /api/recover-access`: the server checks for a paid entitlement, sends a 15-minute email verification link only when one exists, and grants a 30-minute access session after the link is opened. The recovery form gives the same answer for known and unknown emails; email sending runs after the response so its timing and delivery result do not reveal purchase status.

Set `NEXT_PUBLIC_SITE_URL` and `SITE_URL` to the published HTTPS origin. `RAZORPAY_CALLBACK_URL` defaults to `https://winterarctracker.vercel.app/success` and can be overridden for preview testing.

A reusable `winterarc:purchase-click` browser event is dispatched with a `location` detail from each checkout link. Connect Meta Pixel, Google Analytics, and purchase tracking when real IDs and checkout confirmation details are available. No IDs or payment secrets are included.

## Deploy to Vercel

Import this folder as a Next.js project. Add the server-side variables in `.env.example`, connect the existing **private** Vercel Blob store to the project for **Production**, upload the product ZIP to that store, and deploy. Confirm `BLOB_STORE_ID` points to that store in the Production environment; Vercel supplies and rotates `VERCEL_OIDC_TOKEN` for Functions. Keep Test Mode keys and Live Mode keys in separate Vercel environments.

## Secure payment and download delivery

The ZIP is **not** kept in `public` or Git. Upload `Winter_Arc_92_Product.zip` from `G:\Excel Tracker project\Final Package` to a **private** Vercel Blob store at `products/Winter_Arc_92_Product.zip`. `PRODUCT_BLOB_PATH` can point to another private pathname. The old ignored `private/` copy is no longer used for entitlement or production delivery.

The same private store holds `purchase-intents/<nonce>.json`, `purchases/by-link/<plink>.json`, `purchases/by-reference/<purchaseId>.json`, `payments/by-id/<pay>.json`, and `entitlements/by-email/<HMAC(email)>.json`. Reads bypass Blob's cache after overwrites. Only a verified, captured `payment_link.paid` event for a server-created ₹49 link writes a paid entitlement. No email address appears in a Blob pathname or public URL, and no card credentials are stored.

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the selected Razorpay mode. Set `RAZORPAY_WEBHOOK_SECRET` to the separate secret chosen when registering `https://winterarctracker.vercel.app/api/razorpay/webhook`; enable **`payment_link.paid`**. Set the exact callback to `https://winterarctracker.vercel.app/success` for production. Generate distinct random values for `ENTITLEMENT_HASH_SECRET`, `ACCESS_TOKEN_SECRET`, and `DOWNLOAD_SIGNING_SECRET` (for example, `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` three times). The private Blob SDK uses the project connection's `BLOB_STORE_ID` and rotating `VERCEL_OIDC_TOKEN` automatically; no static Blob read-write token is required. New checkout requires the Razorpay credentials, webhook and download secrets, entitlement hash secret, `BLOB_STORE_ID`, and `PRODUCT_BLOB_PATH`. For returning-buyer recovery and optional paid delivery email, configure a verified Resend sender in `DOWNLOAD_FROM_EMAIL`, `RESEND_API_KEY`, `ACCESS_TOKEN_SECRET`, and an HTTPS `SITE_URL`.

Keep `ENTITLEMENT_HASH_SECRET` stable across deployments. Changing it requires migrating the email-keyed entitlement index, or returning customers will not be found. Existing receipts from the old shared Payment Link did not record buyer email and cannot be matched automatically; migrate any real buyers before removing their old access path.

After Razorpay redirects, `/success` verifies the signed callback and waits for a matching paid webhook receipt. A success callback grants a 15-minute signed download only during the first hour after purchase. Returning customers verify by email and receive a new 30-minute access session and 15-minute download token. Download authorization always checks the durable paid receipt before streaming private Blob data. The verified `payment_link.paid` webhook saves the entitlement and paid receipt before sending a 15-minute purchase access link through Resend. Successful email delivery is marked with `emailSentAt` on the paid receipt. Duplicate paid receipts skip both entitlement and email work; Resend also receives a payment-specific idempotency key. Email failure leaves payment and entitlement intact. Recovery diagnostics log configuration presence, lookup outcome, and sanitized Resend errors without printing email addresses or access links.

For Test Mode, deploy a preview or use an HTTPS tunnel reachable by Razorpay. Set `RAZORPAY_CALLBACK_URL` and the webhook URL to that host, and set `SITE_URL` if testing recovery email. Submit a new email, complete the fresh ₹49 Test Mode link, then wait for `/success` to show the download after the paid webhook. Returning buyers can use the separate recovery link to verify their email and obtain renewed access. Test a failed payment, an expired download token, and a duplicate webhook: none may create extra entitlements or expose the ZIP. Razorpay cannot post to `localhost` directly.
