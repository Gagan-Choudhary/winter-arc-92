# Winter Arc 92 landing page

Next.js 15, TypeScript, and Tailwind CSS landing page based on the supplied visual references.

## Run locally

1. Run `npm.cmd install` in this folder.
2. Copy `.env.example` to `.env.local`.
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

All purchase buttons open `/purchase`. The buyer enters an email and optionally a phone number, then receives a neutral verification email. The email link checks durable ownership: owners go to `/access`, and new buyers get a fresh server-created Razorpay Payment Link for ₹49. Resend and a private Vercel Blob store must be configured before checkout can send verification emails.

Set `NEXT_PUBLIC_SITE_URL` and `SITE_URL` to the published HTTPS origin. `RAZORPAY_CALLBACK_URL` defaults to `https://winterarctracker.vercel.app/success` and can be overridden for preview testing.

A reusable `winterarc:purchase-click` browser event is dispatched with a `location` detail from each checkout link. Connect Meta Pixel, Google Analytics, and purchase tracking when real IDs and checkout confirmation details are available. No IDs or payment secrets are included.

## Deploy to Vercel

Import this folder as a Next.js project. Add the server-side variables in `.env.example`, connect a **private** Vercel Blob store, upload the product ZIP, and deploy. Keep Test Mode keys and Live Mode keys in separate Vercel environments.

## Secure payment and download delivery

The ZIP is **not** kept in `public` or Git. Upload `Winter_Arc_92_Product.zip` from `G:\Excel Tracker project\Final Package` to a **private** Vercel Blob store at `products/Winter_Arc_92_Product.zip`. `PRODUCT_BLOB_PATH` can point to another private pathname. The old ignored `private/` copy is no longer used for entitlement or production delivery.

The same private store holds `purchase-intents/<nonce>.json`, `purchases/by-link/<plink>.json`, `payments/by-id/<pay>.json`, and `entitlements/by-email/<HMAC(email)>.json`. Reads bypass Blob's cache after overwrites. Only a verified, captured `payment_link.paid` event for a server-created ₹49 link writes a paid entitlement. No email address appears in a Blob pathname or public URL, and no card credentials are stored.

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the selected Razorpay mode. Set `RAZORPAY_WEBHOOK_SECRET` to the separate secret chosen when registering `https://winterarctracker.vercel.app/api/razorpay/webhook`; enable **`payment_link.paid`**. Set the exact callback to `https://winterarctracker.vercel.app/success` for production. Generate distinct random values for `ENTITLEMENT_HASH_SECRET`, `ACCESS_TOKEN_SECRET`, and `DOWNLOAD_SIGNING_SECRET` (for example, `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` three times). Connect the private Blob store to obtain `BLOB_READ_WRITE_TOKEN`. Configure a verified Resend sender in `DOWNLOAD_FROM_EMAIL` and set `RESEND_API_KEY`; email verification is required before checkout or recovery.

Keep `ENTITLEMENT_HASH_SECRET` stable across deployments. Changing it requires migrating the email-keyed entitlement index, or returning customers will not be found. Existing receipts from the old shared Payment Link did not record buyer email and cannot be matched automatically; migrate any real buyers before removing their old access path.

After Razorpay redirects, `/success` verifies the signed callback and waits for a matching paid webhook receipt. A success callback grants a 15-minute signed download only during the first hour after purchase. Returning customers use `/purchase?mode=recover`, verify by email, and receive a new 30-minute access session and 15-minute download token. Download authorization always checks the durable paid receipt before streaming private Blob data. Paid email delivery is best-effort; failure does not erase the entitlement.

For Test Mode, deploy a preview or use an HTTPS tunnel reachable by Razorpay. Set `SITE_URL`, `RAZORPAY_CALLBACK_URL`, and the webhook URL to that host. Submit a new email, click the verification email, complete the fresh ₹49 Test Mode link, then wait for `/success` to show the download. Retry with the same email: it should email an access link and never open checkout. Try an unverified email, a failed payment, an expired token, and a duplicate webhook: none may create extra entitlements or expose the ZIP. Razorpay cannot post to `localhost` directly.
