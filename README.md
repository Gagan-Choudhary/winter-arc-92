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
