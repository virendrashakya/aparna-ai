"use client";

import {
  useEffect,
  useState,
} from "react";

import AddWardrobeItem from "@/components/wardrobe/AddWardrobeItem";

const times = [
  "Morning",
  "Late morning",
  "Afternoon",
  "Evening",
  "Night",
];

const moods = [
  "Happy",
  "Relaxed",
  "Confident",
  "Playful",
  "Thoughtful",
  "Glamorous",
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
          "/api/wardrobe/list",
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
    <main className="app">
      <header className="header">
        <div>
          <div className="eyebrow">
            APARNA OS
          </div>

          <h1>
            Generate Aparna
          </h1>
        </div>

        <div className="status">
          <span className="status-dot" />
          OPENCLAW + GROK VIDEO
        </div>
      </header>

      <div className="layout">
        <section className="controls">
          <div className="control">
            <label>
              CONTENT
            </label>

            <select
              value="reel"
              disabled
            >
              <option value="reel">
                INSTAGRAM REEL
              </option>
            </select>
          </div>

          <div className="control">
            <label>
              REEL STYLE
            </label>

            <select
              value={reelStyle}
              onChange={(event) =>
                setReelStyle(
                  event.target.value
                )
              }
            >
              {reelStyles.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item
                      .replaceAll(
                        "_",
                        " "
                      )
                      .toUpperCase()}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control">
            <label>
              THIRST LEVEL —{" "}
              {thirstLevel}/5
            </label>

            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={thirstLevel}
              onChange={(event) =>
                setThirstLevel(
                  Number(
                    event.target.value
                  )
                )
              }
            />

            <small>
              1 lifestyle · 3 flirty ·
              4 thirst trap · 5 very
              provocative
            </small>
          </div>

          <div className="control">
            <label>
              REEL LENGTH
            </label>

            <select
              value={reelDuration}
              onChange={(event) =>
                setReelDuration(
                  Number(
                    event.target.value
                  )
                )
              }
            >
              {[
                5,
                6,
                7,
                8,
                9,
                10,
                12,
                15,
              ].map(
                (seconds) => (
                  <option
                    key={seconds}
                    value={seconds}
                  >
                    {seconds} SECONDS
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control">
            <label>
              TIME
            </label>

            <select
              value={time}
              onChange={(event) =>
                setTime(
                  event.target.value
                )
              }
            >
              {times.map(
                (item) => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control">
            <label>
              MOOD
            </label>

            <select
              value={mood}
              onChange={(event) =>
                setMood(
                  event.target.value
                )
              }
            >
              {moods.map(
                (item) => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control">
            <label>
              GARMENT
            </label>

            <select
              value={outfit}
              onChange={(event) =>
                setOutfit(
                  event.target.value
                )
              }
              disabled={
                loadingWardrobe ||
                wardrobe.length === 0
              }
            >
              {loadingWardrobe && (
                <option>
                  Loading wardrobe...
                </option>
              )}

              {!loadingWardrobe &&
                wardrobe.length ===
                  0 && (
                  <option>
                    No garments yet
                  </option>
                )}

              {wardrobe.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control">
            <label>
              HOW IT IS WORN
            </label>

            <select
              value={wearingIntent}
              onChange={(event) =>
                setWearingIntent(
                  event.target.value
                )
              }
              disabled={
                !selectedWardrobeItem
              }
            >
              <option value="default">
                Default garment styling
              </option>

              {intents.map(
                (intent) => (
                  <option
                    key={intent.id}
                    value={intent.id}
                  >
                    {intent.name}
                  </option>
                )
              )}
            </select>

            {wearingIntent !==
              "default" && (
              <small>
                Using the saved styling
                reference, not just the
                garment.
              </small>
            )}
          </div>

          <div className="wardrobe-add-wrapper">
            <AddWardrobeItem
              onAdded={
                loadWardrobe
              }
            />
          </div>

          <div className="control">
            <label>
              LOCATION
            </label>

            <select
              value={location}
              onChange={(event) =>
                setLocation(
                  event.target.value
                )
              }
            >
              {locations.map(
                (item) => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="control">
            <label>
              SHOT
            </label>

            <select
              value={shot}
              onChange={(event) =>
                setShot(
                  event.target.value
                )
              }
            >
              {shots.map(
                (item) => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          <button
            className="generate-button"
            onClick={
              generateImage
            }
            disabled={
              busy ||
              !outfit
            }
          >
            {loadingImage
              ? "CREATING FRAME..."
              : "✦ GENERATE REEL FRAME"}
          </button>

          {image && (
            <button
              className="generate-button"
              onClick={
                generateReel
              }
              disabled={
                busy
              }
            >
              {loadingVideo
                ? "GENERATING VIDEO..."
                : "▶ GENERATE REEL"}
            </button>
          )}
        </section>

        <section className="preview">
          {!image &&
            !video &&
            !loadingImage &&
            !loadingVideo && (
              <div className="empty">
                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  Ready to create
                  Aparna
                </h2>

                <p>
                  Upload real clothing
                  references into her
                  wardrobe, preserve how
                  they are worn, then use
                  the resolved look for
                  image and video
                  generation.
                </p>
              </div>
            )}

          {loadingImage && (
            <div className="loading">
              <div className="loader" />

              <h2>
                Creating Aparna...
              </h2>

              <p>
                Applying the garment
                and its wearing intent.
              </p>
            </div>
          )}

          {loadingVideo && (
            <div className="loading">
              <div className="loader" />

              <h2>
                Animating Aparna...
              </h2>

              <p>
                Grok is turning the
                approved frame into a{" "}
                {reelDuration}-second
                vertical Reel.
              </p>
            </div>
          )}

          {video && (
            <div className="result">
              <video
                src={video}
                controls
                autoPlay
                loop
                muted
                playsInline
                style={{
                  width: "100%",
                  maxHeight:
                    "760px",
                  objectFit:
                    "contain",
                  background:
                    "#050505",
                }}
              />

              <div className="result-info">
                <div>
                  <span>
                    REEL
                  </span>

                  <span>
                    {reelDuration}s
                  </span>

                  <span>
                    9:16
                  </span>

                  <span>
                    720p
                  </span>

                  <span>
                    Thirst{" "}
                    {thirstLevel}/5
                  </span>

                  {wearingIntent !==
                    "default" && (
                    <span>
                      Styled reference
                    </span>
                  )}
                </div>

                <div className="result-actions">
                  <button
                    onClick={
                      generateReel
                    }
                    disabled={
                      loadingVideo
                    }
                  >
                    ↻ REGENERATE
                  </button>

                  <button className="approve">
                    ✓ APPROVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {!video &&
            image &&
            !loadingVideo && (
              <div className="result">
                <img
                  src={image}
                  alt="Aparna Reel first frame"
                />

                <div className="result-info">
                  <div>
                    <span>
                      REEL FRAME
                    </span>

                    <span>
                      Thirst{" "}
                      {thirstLevel}/5
                    </span>

                    <span>
                      9:16
                    </span>

                    {wearingIntent !==
                      "default" && (
                      <span>
                        Styled reference
                      </span>
                    )}
                  </div>

                  <div className="result-actions">
                    <button
                      onClick={
                        generateImage
                      }
                      disabled={
                        loadingImage
                      }
                    >
                      ↻ REGENERATE FRAME
                    </button>

                    <button
                      className="approve"
                      onClick={
                        generateReel
                      }
                    >
                      ▶ GENERATE VIDEO
                    </button>
                  </div>
                </div>
              </div>
            )}
        </section>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </main>
  );
}