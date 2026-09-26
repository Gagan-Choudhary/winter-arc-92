import type { Metadata, Viewport } from "next";
import "./globals.css";

const base = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined;
export const metadata: Metadata = {
  metadataBase: base,
  title: "Winter Arc 92 | 92-Day Excel Habit Tracker",
  description: "Build better habits and track your Winter Arc with a 92-day Excel habit tracker featuring dashboards, streaks, weekly reviews, and Light + Dark themes.",
  alternates: base ? { canonical: "/" } : undefined,
  openGraph: { title: "Winter Arc 92 | 92-Day Excel Habit Tracker", description: "Track the habits. See the progress. Finish your Winter Arc.", type: "website", url: base?.toString(), images: base ? [{ url: "/og.svg", width: 1200, height: 630, alt: "Winter Arc 92 — Finish It" }] : undefined },
  twitter: { card: "summary_large_image", images: base ? ["/og.svg"] : undefined, title: "Winter Arc 92 | 92-Day Excel Habit Tracker", description: "A 92-day Excel habit tracker built to help you finish." },
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0D0D0F" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
