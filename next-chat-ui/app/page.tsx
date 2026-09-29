"use client";

import { useState } from "react";

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

const outfits = [
  { id: "dress_001", name: "Green bodycon dress" },
  { id: "dress_002", name: "Black cut-out mini dress" },
  { id: "casual_001", name: "White shirt + jeans" },
  { id: "home_001", name: "Casual homewear" },
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

export default function Home() {
  const [time, setTime] = useState("Evening");
  const [mood, setMood] = useState("Confident");
  const [outfit, setOutfit] = useState("dress_001");
  const [location, setLocation] = useState("Living room");
  const [shot, setShot] = useState("Full body");

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateImage() {
    setLoading(true);
    setError("");
    setImage(null);

    try {
      const response = await fetch("/api/aparna/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time,
          mood,
          outfit_id: outfit,
          location,
          shot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Image generation failed");
      }

      setImage(data.image);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <div className="eyebrow">APARNA OS</div>
          <h1>Generate Aparna</h1>
        </div>

        <div className="status">
          <span className="status-dot" />
          OPENCLAW CONNECTED
        </div>
      </header>

      <div className="layout">
        {/* CONTROLS */}
        <section className="controls">
          <div className="control">
            <label>TIME</label>

            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {times.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>MOOD</label>

            <select value={mood} onChange={(e) => setMood(e.target.value)}>
              {moods.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>DRESS</label>

            <select
              value={outfit}
              onChange={(e) => setOutfit(e.target.value)}
            >
              {outfits.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>LOCATION</label>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>SHOT</label>

            <select value={shot} onChange={(e) => setShot(e.target.value)}>
              {shots.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <button
            className="generate-button"
            onClick={generateImage}
            disabled={loading}
          >
            {loading ? "GENERATING..." : "✦ GENERATE IMAGE"}
          </button>
        </section>

        {/* IMAGE */}
        <section className="preview">
          {!image && !loading && (
            <div className="empty">
              <div className="empty-icon">✦</div>

              <h2>Ready to create Aparna</h2>

              <p>
                Choose the time, mood, dress and scene,
                then generate an Instagram-ready photo.
              </p>
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="loader" />
              <h2>Creating Aparna...</h2>
              <p>
                OpenClaw is preparing the scene and image.
              </p>
            </div>
          )}

          {image && (
            <div className="result">
              <img src={image} alt="Generated Aparna" />

              <div className="result-info">
                <div>
                  <span>{time}</span>
                  <span>{mood}</span>
                  <span>{location}</span>
                  <span>{shot}</span>
                </div>

                <div className="result-actions">
                  <button onClick={generateImage}>
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