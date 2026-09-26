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

Set `NEXT_PUBLIC_CHECKOUT_URL` to the actual hosted checkout URL. Every purchase CTA uses this one setting. Until it is set, purchase controls are visibly inactive and do not send customers to a fake payment page. The header price link scrolls to the pricing section.

Set `NEXT_PUBLIC_SITE_URL` to the published HTTPS origin, for example `https://example.com`, to enable the canonical URL and absolute social metadata. Replace this example with your real domain.

A reusable `winterarc:purchase-click` browser event is dispatched with a `location` detail from each checkout link. Connect Meta Pixel, Google Analytics, and purchase tracking when real IDs and checkout confirmation details are available. No IDs or payment secrets are included.

## Deploy to Vercel

Import this folder as a Next.js project. Add `NEXT_PUBLIC_CHECKOUT_URL` and `NEXT_PUBLIC_SITE_URL` in Vercel project settings, then deploy. Verify checkout on a staging URL before directing ad traffic to the site.

## Secure payment and download delivery

The ZIP is **not** kept in `public` or Git. Create a **private** Vercel Blob store connected to the project and upload `Winter_Arc_92_Product.zip` at `products/Winter_Arc_92_Product.zip` (or set `PRODUCT_BLOB_PATH` to your chosen private Blob pathname). The repository ignores ZIP files as a safeguard. The same private store holds payment receipts under `payment-receipts/`.

For local development, the verified ZIP from `G:\Excel Tracker project\Final Package\Winter_Arc_92_Product.zip` has been copied to the ignored `private/Winter_Arc_92_Product.zip`. Without a Blob token, `next dev` keeps receipts in `private/payment-receipts/` and serves this private local ZIP through the same authenticated route. Production builds require the private Vercel Blob store; the local copy is never included in a Vercel deployment.

Set the server-side variables from `.env.example` in Vercel for the same environment as your Razorpay Payment Link. `RAZORPAY_KEY_SECRET` must match that Razorpay Test or Live Mode link. `RAZORPAY_WEBHOOK_SECRET` is the separate secret you choose when creating the webhook. `RAZORPAY_PAYMENT_LINK_ID` is the exact `plink_...` ID for this ₹49 product. Generate a unique `DOWNLOAD_SIGNING_SECRET` of at least 32 random bytes. Keep all of these private. `BLOB_READ_WRITE_TOKEN` is supplied when you connect the private store. `SITE_URL`, `RESEND_API_KEY`, and `DOWNLOAD_FROM_EMAIL` are optional together for email delivery via Resend; configure a verified sending domain before enabling them.

Set the Payment Link's callback URL to `https://YOUR-DOMAIN/success` with callback method `GET`. Register `https://YOUR-DOMAIN/api/razorpay/webhook` in the Razorpay dashboard and enable **`payment_link.paid`**. This endpoint accepts only a valid raw-body webhook signature and a captured INR 49 payment on the configured link. If the Payment Link's callback cannot be changed after creation, create a new ₹49 link with that callback and update `NEXT_PUBLIC_CHECKOUT_URL` and `RAZORPAY_PAYMENT_LINK_ID` together. A standard Payment Link can become paid after a purchase; confirm that your Razorpay checkout setup supports your intended number of buyers before launch.

On return, `/success` checks Razorpay's signed callback and waits for a matching verified webhook receipt. Only then does it display the success message and a 15-minute signed download. The `/api/download` route verifies the token, the private receipt, and a seven-day delivery window before streaming the ZIP from private Blob storage. Invalid, expired, or failed payments never receive the file. Refreshing the authentic success URL within seven days makes a fresh 15-minute link. Optional email delivery sends a 24-hour link; this is best-effort and a Resend failure does not erase a paid receipt.

For Test Mode, deploy a preview or local site reachable by Razorpay (for local development, use an HTTPS tunnel), set the callback and webhook URLs to that host, then complete a ₹49 Test Mode payment. Verify that `/success` shows a pending state until `payment_link.paid` is received and then offers the download. Also test a forged callback, a webhook with an invalid signature, and an expired token: none should download the ZIP. Razorpay cannot post a webhook to `localhost` directly.
