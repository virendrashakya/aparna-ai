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
  status: string;
};

export default function Home() {
  const [time, setTime] =
    useState("Evening");

  const [mood, setMood] =
    useState("Confident");

  const [outfit, setOutfit] =
    useState("");

  const [location, setLocation] =
    useState("Living room");

  const [shot, setShot] =
    useState("Full body");

  const [wardrobe, setWardrobe] =
    useState<WardrobeItem[]>([]);

  const [image, setImage] =
    useState<string | null>(null);

  const [loading, setLoading] =
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
        !outfit &&
        items.length > 0
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

  async function generateImage() {
    if (!outfit) {
      setError(
        "Add at least one garment to the wardrobe first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setImage(null);

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
              location,
              shot,
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

      setImage(data.image);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

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
          OPENCLAW CONNECTED
        </div>
      </header>

      <div className="layout">
        <section className="controls">
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
              DRESS
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
              loading ||
              !outfit
            }
          >
            {loading
              ? "GENERATING..."
              : "✦ GENERATE IMAGE"}
          </button>
        </section>

        <section className="preview">
          {!image &&
            !loading && (
              <div className="empty">
                <div className="empty-icon">
                  ✦
                </div>

                <h2>
                  Ready to create
                  Aparna
                </h2>

                <p>
                  Add a real garment
                  from a supported
                  retailer, choose the
                  scene, then generate
                  Aparna.
                </p>
              </div>
            )}

          {loading && (
            <div className="loading">
              <div className="loader" />

              <h2>
                Creating Aparna...
              </h2>

              <p>
                OpenClaw is preparing
                the scene and image.
              </p>
            </div>
          )}

          {image && (
            <div className="result">
              <img
                src={image}
                alt="Generated Aparna"
              />

              <div className="result-info">
                <div>
                  <span>
                    {time}
                  </span>

                  <span>
                    {mood}
                  </span>

                  <span>
                    {location}
                  </span>

                  <span>
                    {shot}
                  </span>
                </div>

                <div className="result-actions">
                  <button
                    onClick={
                      generateImage
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

          {error && (
            <div className="error">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}