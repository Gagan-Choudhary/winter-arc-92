import Image from "next/image";

type Variant = "hero" | "dashboard" | "tracker" | "themes";
const assets = {
  hero: { src: "/images/dark-dashboard.png", alt: "Dark Winter Arc 92 dashboard with score, streaks, consistency chart, and top habits" },
  dashboard: { src: "/images/light-dashboard.png", alt: "Light Winter Arc 92 dashboard showing progress charts and top habits" },
  tracker: { src: "/images/light-tracker.png", alt: "Light Winter Arc 92 daily tracker with habits and daily completion cells" },
  themes: { src: "/images/dark-tracker.png", alt: "Dark Winter Arc 92 daily tracker with habits and daily completion cells" },
};

function Screenshot({ src, alt, priority = false, className = "" }: { src: string; alt: string; priority?: boolean; className?: string }) {
  return <a href={src} target="_blank" rel="noopener noreferrer" className={`real-preview ${className}`} aria-label={`Open full-size screenshot: ${alt}`}>
    <Image src={src} alt={alt} fill priority={priority} sizes={priority ? "(max-width: 640px) 100vw, 900px" : "(max-width: 640px) 100vw, (max-width: 800px) 33vw, 370px"} />
  </a>;
}

export function ProductVisual({ variant, priority = false }: { variant: Variant; priority?: boolean }) {
  if (variant === "themes") return <div className="theme-comparison">
    <Screenshot src={assets.tracker.src} alt={assets.tracker.alt} className="theme-light" />
    <Screenshot src={assets.themes.src} alt={assets.themes.alt} className="theme-dark" />
    <span className="theme-label theme-label-light">LIGHT</span><span className="theme-label theme-label-dark">DARK</span>
  </div>;
  const asset = assets[variant];
  return <Screenshot src={asset.src} alt={asset.alt} priority={priority} />;
}
