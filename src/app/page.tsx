import { PurchaseButton } from "@/components/PurchaseButton";
import { ProductVisual } from "@/components/ProductVisual";
import { MobileStickyCTA } from "@/components/MobileStickyCTA";

const steps = [
  ["01", "SET YOUR HABITS", "Choose your habits and weekly goals."],
  ["02", "TRACK DAILY", "Mark completed habits each day."],
  ["03", "WATCH YOUR PROGRESS", "Your dashboard and analytics update automatically."],
  ["04", "REVIEW WEEKLY", "See what worked and improve the next week."],
];
const benefits = [
  ["\u25a6", "92-Day Tracking", "One clear place for every day."],
  ["\u2197", "Automatic Dashboard", "Progress updates as you track."],
  ["\u2726", "Streak Tracking", "Keep your momentum visible."],
  ["\u25a4", "Weekly Review", "Reflect and keep improving."],
  ["\u270e", "Custom Habits", "Track what matters to you."],
  ["\u221e", "No Subscription", "Buy once. Keep your files."],
];
const faqs = [
  ["What is Winter Arc 92?", "A 92-day Excel habit tracker with a dashboard, daily tracking, and weekly reviews to help you stay consistent."],
  ["Do I need Microsoft Excel?", "The files are made for Microsoft Excel. Other spreadsheet apps may not support every feature or formula."],
  ["Can I customize my habits?", "Yes. Choose and edit the habits you want to track."],
  ["Do I get both Light and Dark versions?", "Yes. Both Excel versions are included in the same purchase."],
  ["How will I receive the files?", "Your files will be available as a digital download after payment through the checkout provider."],
];

function Eyebrow({ children }: { children: React.ReactNode }) { return <p className="eyebrow">{children}</p>; }
function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: string }) {
  return <div className="section-heading"><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2>{description && <p>{description}</p>}</div>;
}

export default function Home() {
  return <>
    <header className="site-header"><div className="wrap header-inner"><a href="#top" className="brand" aria-label="Winter Arc 92 home"><span className="brand-star">✦</span> WINTER ARC <b>92</b></a><span className="header-tag">LIGHT + DARK INCLUDED</span><a href="#pricing" className="header-link">GET IT FOR ₹49 <span aria-hidden="true">↗</span></a></div></header>
    <main id="top">
      <section className="hero section" aria-labelledby="hero-title"><div className="wrap hero-inner">
        <div className="hero-copy"><div className="hero-kicker"><span>✦</span> A 92-DAY RESET STARTS HERE <span>✦</span></div><h1 id="hero-title">Don’t Just Start Your Winter Arc.<br /><em>Finish It.</em></h1><p className="hero-description">A 92-day Excel habit tracker to build habits, stay consistent, and see your progress every day.</p>
          <div className="hero-price"><s>₹199</s><strong>₹49</strong><span>OFFER PRICE</span></div>
          <div id="hero-purchase" className="hero-purchase"><PurchaseButton label="START MY WINTER ARC — ₹49" location="hero" /></div>
          <p className="micro-trust">Instant Download <i /> One-Time Payment <i /> Light + Dark Included</p>
        </div>
        <div className="hero-showcase"><div className="showcase-bar"><span><i /><i /><i /> WINTER ARC 92 / DASHBOARD</span><span>YOUR 92-DAY SYSTEM</span></div><div className="showcase-image"><ProductVisual variant="hero" priority /></div><span className="showcase-chip chip-left">92 DAYS<br /><b>ONE CLEAR DIRECTION</b></span><span className="showcase-chip chip-right">LIGHT + DARK<br /><b>INCLUDED</b></span></div>
      </div></section>

      <section className="section progress" id="progress" aria-labelledby="progress-title"><div className="wrap"><div className="section-heading"><Eyebrow>DESIGNED FOR ACTION</Eyebrow><h2 id="progress-title">SEE YOUR PROGRESS.<br />NOT JUST YOUR PLANS.</h2><p>Spreadsheets that look like the real work feels: clear, focused, and ready to use.</p></div><div className="progress-grid">
        <article className="preview-card"><div className="feature-icon blue">↗</div><h3>Executive Analytics Dashboard</h3><p>See your habits, streaks, and progress in one clear view.</p><div className="preview-image"><ProductVisual variant="dashboard" /></div></article>
        <article className="preview-card"><div className="feature-icon green">▦</div><h3>Intuitive Daily Tracker</h3><p>Mark each day and watch your consistency build over time.</p><div className="preview-image"><ProductVisual variant="tracker" /></div></article>
        <article className="preview-card"><div className="feature-icon gold">☼</div><h3>Choose Your Mode: Light + Dark</h3><p>Pick the version that fits the way you work.</p><div className="preview-image"><ProductVisual variant="themes" /></div></article>
      </div></div></section>

      <section className="section how" id="how-it-works"><div className="wrap"><SectionTitle eyebrow="SIMPLE SYSTEM · LASTING PROGRESS" title="HOW IT WORKS" description="Four simple steps to make every day count." /><div className="steps-grid">{steps.map(([number,title,copy])=><article className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

      <section className="section tagline" aria-labelledby="tagline-title">
        <div className="wrap tagline-inner">
          <h2 id="tagline-title">Goals set the direction.<br /><span>Systems</span> create the result.</h2>
          <p>Build yours for the next 92 days.</p>
        </div>
      </section>
      <section className="section benefits" id="benefits"><div className="wrap"><SectionTitle eyebrow="BUILT FOR CONSISTENCY" title="DESIGNED TO PREVENT BURNOUT" description="Everything you need to make progress over 92 days." /><div className="benefits-grid">{benefits.map(([icon,title,copy],index)=><article className="benefit-card" key={title}><span className={`feature-icon ${index===2?"gold":index===5?"green":"blue"}`} aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div></div></section>

      <section className="section offer-section" id="bundle"><div className="wrap"><SectionTitle eyebrow="ONE SYSTEM · TWO MODES" title={<>COMPLETE WINTER ARC<br />BUNDLE</>} description="The complete toolkit in Light and Dark." /><div className="offer-grid"><div className="bundle-card"><div className="bundle-top"><span>INCLUDED IN YOUR PURCHASE</span><b>LIGHT + DARK INCLUDED</b></div><ul><li><strong>Winter Arc 92 — Dark.xlsx</strong><span>Focused dark dashboard and tracker</span></li><li><strong>Winter Arc 92 — Light.xlsx</strong><span>Bright, clean dashboard and tracker</span></li><li><strong>Quick Start Guide</strong><span>Get set up and start tracking</span></li><li><strong>Habit Ideas</strong><span>Inspiration for your 92 days</span></li><li><strong>Lifetime File Access</strong><span>Keep your downloaded files</span></li></ul><p className="bundle-foot"><span>✦</span> Made to keep your progress in sight.</p></div>
        <div className="pricing-card" id="pricing"><Eyebrow>ONE-TIME PAYMENT</Eyebrow><h3>START YOUR WINTER ARC</h3><p>Complete 92-day system + both versions</p><div className="price-lockup"><s>₹199</s><strong>₹49</strong><span>OFFER PRICE</span></div><div className="pricing-points"><span>✓ One-Time Payment</span><span>✓ Instant Digital Download</span><span>✓ No Subscription</span><span>✓ Light + Dark Included</span></div><PurchaseButton label="GET WINTER ARC 92 — ₹49" location="pricing" /><p className="pricing-foot">Instant access after checkout</p></div></div></div></section>

      <section className="section faq-section" id="faq"><div className="wrap faq-wrap"><SectionTitle eyebrow="COMMON QUESTIONS" title="FREQUENTLY ASKED QUESTIONS" /><div className="faq-list">{faqs.map(([question,answer],i)=><details key={question} open={i===0}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="section final-section" id="final-cta"><div className="wrap final-card"><Eyebrow>YOUR NEXT 92 DAYS START HERE</Eyebrow><h2>92 DAYS FROM NOW,<br />YOU’LL WISH YOU STARTED TODAY.</h2><p>Track the habits. See the progress. Finish your Winter Arc.</p><PurchaseButton label="START MY WINTER ARC — ₹49" location="final" /><span>One-Time Payment · Light + Dark Included</span></div></section>
    </main>
    <footer className="site-footer"><div className="wrap footer-inner"><a href="#top" className="brand">✦ WINTER ARC <b>92</b></a><p>© {new Date().getFullYear()} Winter Arc 92. All rights reserved.</p><a href="#faq">Questions? See FAQ ↗</a></div></footer>
    <MobileStickyCTA />
  </>;
}
