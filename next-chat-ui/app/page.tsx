"use client";

import Link from "next/link";

const features = [
  {
    number: "01",
    title: "A living wardrobe",
    text: "A canonical wardrobe with garment identity and saved wearing references."
  },
  {
    number: "02",
    title: "A consistent Aparna",
    text: "Face, body, hair and environments stay grounded across every scene."
  },
  {
    number: "03",
    title: "Made for social",
    text: "Create editorial photographs and vertical Reel frames from one visual system."
  },
];

const looks = [
  { image: "/generated/aparna-1791203296196.jpg", label: "01 / intimate" },
  { image: "/generated/aparna-1791202832918.jpg", label: "02 / everyday" },
  { image: "/generated/aparna-1791202299580.jpg", label: "03 / after dark" },
];

export default function LandingPage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link href="/" className="landing-logo">APARNA <span>ROY</span></Link>
        <div className="landing-nav-links">
          <a href="#story">STORY</a>
          <a href="#looks">LOOKS</a>
          <a href="#system">THE SYSTEM</a>
          <Link href="/generator" className="landing-nav-cta">OPEN STUDIO</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="landing-kicker">A DIGITAL FASHION PERSONA / MUMBAI</p>
          <h1>Aparna<em>Roy.</em></h1>
          <p className="hero-lede">
            Fashion, everyday life and a little bit of trouble —
            told through the lens of a woman who feels real.
          </p>
          <div className="hero-actions">
            <Link href="/generator" className="landing-primary">
              ENTER APARNA&apos;S STUDIO <span>↗</span>
            </Link>
            <a href="#looks" className="landing-secondary">EXPLORE THE LOOKS</a>
          </div>
          <div className="hero-meta">
            <span>INDIAN / ADULT / FICTIONAL</span>
            <span>01 — 07</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-image-wrap">
            <img src="/generated/aparna-1791203296196.jpg" alt="Aparna Roy" className="hero-image" />
          </div>
          <div className="hero-note hero-note-top">MUMBAI / 19:42</div>
          <div className="hero-note hero-note-bottom"><span>01</span> THE GIRL BEHIND THE FRAME</div>
        </div>
      </section>

      <section id="story" className="landing-story">
        <div className="section-index">01</div>
        <div className="story-title">
          <p className="landing-kicker">NOT JUST A MODEL</p>
          <h2>A life<br />between<br /><em>the posts.</em></h2>
        </div>
        <div className="story-text">
          <p>
            Aparna is a fictional adult Indian woman living in Mumbai.
            She works in tech, spends most days at home, meets people,
            gets dressed, changes her mind and occasionally turns an
            ordinary moment into something worth photographing.
          </p>
          <p>
            The point is not to generate another perfect AI model.
            The point is continuity — the same woman, wardrobe,
            apartment and visual language appearing to evolve over time.
          </p>
        </div>
      </section>

      <section id="looks" className="landing-looks">
        <div className="looks-heading">
          <div>
            <p className="landing-kicker">THE FEED</p>
            <h2>Three moods.<br /><em>One Aparna.</em></h2>
          </div>
          <span>SCROLL / 03</span>
        </div>
        <div className="looks-grid">
          {looks.map((look) => (
            <article className="look-card" key={look.image}>
              <img src={look.image} alt={\`Aparna — \${look.label}\`} />
              <div className="look-caption">{look.label}</div>
            </article>
          ))}
        </div>
      </section>

      <section id="system" className="landing-system">
        <div className="section-index">02</div>
        <div>
          <p className="landing-kicker">THE APARNA SYSTEM</p>
          <h2>Character first.<br /><em>Content second.</em></h2>
        </div>
        <div className="feature-list">
          {features.map((feature) => (
            <div className="feature-row" key={feature.number}>
              <span>{feature.number}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="cta-image">
          <img src="/generated/aparna-1791202299580.jpg" alt="Aparna fashion portrait" />
        </div>
        <div className="cta-copy">
          <p className="landing-kicker">APARNA ROY / STUDIO</p>
          <h2>Build the<br /><em>next frame.</em></h2>
          <p>
            Choose her mood, wardrobe, wearing intent, location and
            camera language. The studio handles the rest.
          </p>
          <Link href="/generator" className="landing-primary">
            OPEN GENERATION STUDIO <span>↗</span>
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>APARNA ROY</span>
        <span>FICTIONAL AI FASHION PERSONA</span>
        <span>OPENCLAW / GROK</span>
      </footer>
    </main>
  );
}
