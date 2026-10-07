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

const locations = [
  "Bedroom",
  "Living room",
  "Kitchen",
  "Balcony",
  "Cafe",
  "Restaurant",
  "Office",
  "Outdoor",
];

const shots = [
  "Selfie",
  "Mirror",
  "Full body",
  "Half body",
  "Casual phone photo",
  "Fashion portrait",
];

const reelStyles = [
  "indian_glam_thirst_trap",
  "mirror_glam",
  "saree_glam",
  "bodycon_glam",
  "night_out_glam",
  "resort_glam",
];

type WearingIntent = {
  id: string;
  name: string;
};

type WardrobeItem = {
  id: string;
  name: string;
  type: string;
  category: string;
  brand: string;
  image_reference?: {
    front?: string | null;
    back?: string | null;
    detail?: string | null;
  };
  wearing_intents?: WearingIntent[];
  status: string;
};

export default function Home() {
  const [time, setTime] =
    useState("Evening");

  const [mood, setMood] =
    useState("Confident");

  const [outfit, setOutfit] =
    useState("");

  const [wearingIntent, setWearingIntent] =
    useState("default");

  const [location, setLocation] =
    useState("Living room");

  const [shot, setShot] =
    useState("Full body");

  const [reelStyle, setReelStyle] =
    useState(
      "indian_glam_thirst_trap"
    );

  const [thirstLevel, setThirstLevel] =
    useState(4);

  const [reelDuration, setReelDuration] =
    useState(8);

  const [wardrobe, setWardrobe] =
    useState<WardrobeItem[]>([]);

  const [image, setImage] =
    useState<string | null>(null);

  const [video, setVideo] =
    useState<string | null>(null);

  const [loadingImage, setLoadingImage] =
    useState(false);

  const [loadingVideo, setLoadingVideo] =
    useState(false);

  const [loadingWardrobe, setLoadingWardrobe] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadWardrobe() {
    try {
      setLoadingWardrobe(true);

      const response =
        await fetch(
          "/api/wardrobe",
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load wardrobe."
        );
      }

      const data =
        await response.json();

      const items =
        Array.isArray(data.items)
          ? data.items
          : [];

      setWardrobe(items);

      if (
        items.length > 0 &&
        !items.some(
          (item: WardrobeItem) =>
            item.id === outfit
        )
      ) {
        setOutfit(
          items[0].id
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load wardrobe."
      );
    } finally {
      setLoadingWardrobe(false);
    }
  }

  useEffect(() => {
    loadWardrobe();
  }, []);

  const selectedWardrobeItem =
    wardrobe.find(
      (item) =>
        item.id === outfit
    );

  useEffect(() => {
    const intents =
      selectedWardrobeItem
        ?.wearing_intents ||
      [];

    if (
      wearingIntent !==
        "default" &&
      !intents.some(
        (item) =>
          item.id === wearingIntent
      )
    ) {
      setWearingIntent(
        "default"
      );
    }
  }, [
    outfit,
    selectedWardrobeItem,
    wearingIntent,
  ]);

  async function generateImage() {
    if (!outfit) {
      setError(
        "Add at least one garment to the wardrobe first."
      );

      return;
    }

    setLoadingImage(true);
    setError("");
    setImage(null);
    setVideo(null);

    try {
      const response =
        await fetch(
          "/api/aparna/generate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              time,
              mood,
              outfit_id:
                outfit,

              wearing_intent_id:
                wearingIntent,

              location,
              shot,

              content_type:
                "reel_cover",

              reel_style:
                reelStyle,

              thirst_level:
                thirstLevel,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Image generation failed"
        );
      }

      setImage(
        data.image
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoadingImage(false);
    }
  }

  async function generateReel() {
    if (!image) {
      setError(
        "Generate the Aparna frame first."
      );

      return;
    }

    setLoadingVideo(true);
    setError("");
    setVideo(null);

    try {
      const response =
        await fetch(
          "/api/aparna/reel",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              image,

              reel_style:
                reelStyle,

              thirst_level:
                thirstLevel,

              duration:
                reelDuration,

              location,
              mood,
              shot,

              outfit_id:
                outfit,

              wearing_intent_id:
                wearingIntent,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Reel generation failed"
        );
      }

      setVideo(
        data.video
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Reel generation failed."
      );
    } finally {
      setLoadingVideo(false);
    }
  }

  const busy =
    loadingImage ||
    loadingVideo;

  const intents =
    selectedWardrobeItem
      ?.wearing_intents ||
    [];

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
