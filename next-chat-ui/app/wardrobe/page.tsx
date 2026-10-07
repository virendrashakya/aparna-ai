"use client";

import { useEffect, useMemo, useState } from "react";
import AddWardrobeItem from "@/components/wardrobe/AddWardrobeItem";
import Link from "next/link";

type WearingIntent = {
  id: string;
  name?: string;
  description?: string;
  waist?: string;
  position?: string;
  fit?: string;
  silhouette?: string;
  neckline?: string;
  sleeves?: string;
  tuck?: string;
  drape?: string;
  layering?: string;
  exposure?: string;
  preserve?: string[];
  constraints?: string[];
  reference_image?: string;
  [key: string]: unknown;
};

type WardrobeImage = {
  id?: string;
  url?: string;
  local_path?: string;
  source_url?: string;
  role?: string;
  tags?: string[];
  [key: string]: unknown;
};

type WardrobeItem = {
  id: string;
  name?: string;
  category?: string;
  brand?: string;
  color?: string;
  fit?: string;
  length?: string;
  details?: string[];
  status?: string;

  garment?: {
    name?: string;
    original_name?: string;
    brand?: string;
    category?: string;
    type?: string;
    subtype?: string;
    color?: string;
    secondary_colors?: string[];
    material?: string;
    pattern?: string;
    fit?: string;
    length?: string;
    neckline?: string;
    sleeves?: string;
    straps?: string;
    details?: string[];
    [key: string]: unknown;
  };

  wearing_intents?: WearingIntent[];

  visual_reference?: {
    front?: string;
    back?: string;
    source?: string;
    [key: string]: unknown;
  };

  images?: WardrobeImage[];

  source?: {
    type?: string;
    original_filename?: string;
    [key: string]: unknown;
  };

  usage?: Record<string, unknown>;

  [key: string]: unknown;
};

const CATEGORY_FILTERS = [
  "all",
  "dress",
  "top",
  "bottom",
  "saree",
  "blouse",
  "lingerie",
  "activewear",
  "outerwear",
  "footwear",
  "accessories",
];

function getCategory(item: WardrobeItem) {
  return (
    item.garment?.category ||
    item.category ||
    item.garment?.type ||
    "other"
  ).toLowerCase();
}

function getName(item: WardrobeItem) {
  return (
    item.name ||
    item.garment?.name ||
    item.garment?.original_name ||
    "Unnamed garment"
  );
}

function getBrand(item: WardrobeItem) {
  return item.garment?.brand || item.brand || "";
}

function getColor(item: WardrobeItem) {
  return item.garment?.color || item.color || "";
}

function getPrimaryImage(item: WardrobeItem) {
  const images = Array.isArray(item.images)
    ? item.images
    : [];

  const preferredRoles = [
    "wearing_and_garment_reference",
    "front",
    "dress_only",
    "side",
    "closeup_front",
  ];

  for (const role of preferredRoles) {
    const match = images.find(
      (image) =>
        image.role === role &&
        typeof image.url === "string"
    );

    if (match?.url) {
      return match.url;
    }
  }

  const firstImage = images.find(
    (image) => typeof image.url === "string"
  );

  if (firstImage?.url) {
    return firstImage.url;
  }

  /*
   * Legacy wardrobe items use visual_reference instead
   * of the newer images[] structure.
   *
   * These paths are intentionally converted to the
   * wardrobe image endpoint when possible.
   */
  const legacyPath =
    item.visual_reference?.front ||
    item.visual_reference?.source;

  if (legacyPath) {
    const filename = legacyPath.split("/").pop();

    if (filename) {
      return `/api/wardrobe/${encodeURIComponent(
        item.id
      )}/image?image=${encodeURIComponent(
        filename
      )}`;
    }
  }

  return null;
}

function formatValue(value?: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getIntentDetails(intent: WearingIntent) {
  return [
    ["Waist", intent.waist],
    ["Position", intent.position],
    ["Fit", intent.fit],
    ["Silhouette", intent.silhouette],
    ["Neckline", intent.neckline],
    ["Sleeves", intent.sleeves],
    ["Tuck", intent.tuck],
    ["Drape", intent.drape],
    ["Layering", intent.layering],
    ["Exposure", intent.exposure],
  ].filter(
    ([, value]) =>
      typeof value === "string" &&
      value.trim().length > 0
  );
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState("all");
  const [selectedItem, setSelectedItem] =
    useState<WardrobeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWardrobe() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/wardrobe",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Wardrobe request failed: ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setItems(
            Array.isArray(data.items)
              ? data.items
              : []
          );
        }
      } catch (err) {
        console.error(
          "WARDROBE PAGE ERROR",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load wardrobe."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWardrobe();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") {
      return items;
    }

    return items.filter(
      (item) =>
        getCategory(item) ===
        selectedCategory
    );
  }, [items, selectedCategory]);

  const availableCategories = useMemo(() => {
    const categories = new Set(
      items.map(getCategory)
    );

    return CATEGORY_FILTERS.filter(
      (category) =>
        category === "all" ||
        categories.has(category)
    );
  }, [items]);

  return (
    <main className="wardrobe-page">
      <header className="wardrobe-page-header">
        <div>
          <div className="wardrobe-eyebrow">
            APARNA ROY
          </div>

          <h1>Wardrobe</h1>

          <p>
            Every garment, reference and
            wearing style in one place.
          </p>
        </div>

        <div className="wardrobe-header-actions">
          <AddWardrobeItem />

          <Link
            href="/"
            className="wardrobe-back-link"
          >
            ← Generator
          </Link>
        </div>
      </header>

      <div className="wardrobe-toolbar">
        <div className="wardrobe-category-list">
          {availableCategories.map(
            (category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory ===
                  category
                    ? "wardrobe-filter active"
                    : "wardrobe-filter"
                }
                onClick={() =>
                  setSelectedCategory(
                    category
                  )
                }
              >
                {formatValue(category)}
              </button>
            )
          )}
        </div>

        <div className="wardrobe-count">
          {filteredItems.length}{" "}
          {filteredItems.length === 1
            ? "item"
            : "items"}
        </div>
      </div>

      {loading && (
        <div className="wardrobe-state">
          <div className="wardrobe-state-title">
            Loading wardrobe…
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="wardrobe-state error">
          <div className="wardrobe-state-title">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
          >
            Retry
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        filteredItems.length === 0 && (
          <div className="wardrobe-state">
            <div className="wardrobe-state-title">
              No garments found.
            </div>

            <p>
              Add something to Aparna&apos;s
              wardrobe to see it here.
            </p>

            <Link
              href="/"
              className="wardrobe-primary-button"
            >
              Add to Wardrobe
            </Link>
          </div>
        )}

      {!loading &&
        !error &&
        filteredItems.length > 0 && (
          <section className="wardrobe-grid">
            {filteredItems.map((item) => {
              const image =
                getPrimaryImage(item);

              const intents =
                Array.isArray(
                  item.wearing_intents
                )
                  ? item.wearing_intents
                  : [];

              return (
                <button
                  key={item.id}
                  type="button"
                  className="wardrobe-card"
                  onClick={() =>
                    setSelectedItem(item)
                  }
                >
                  <div className="wardrobe-card-image">
                    {image ? (
                      <img
                        src={image}
                        alt={getName(item)}
                      />
                    ) : (
                      <div className="wardrobe-no-image">
                        No reference
                      </div>
                    )}
                  </div>

                  <div className="wardrobe-card-content">
                    <div className="wardrobe-card-top">
                      <span>
                        {formatValue(
                          getCategory(item)
                        )}
                      </span>

                      {getBrand(item) && (
                        <span>
                          {getBrand(item)}
                        </span>
                      )}
                    </div>

                    <h2>
                      {getName(item)}
                    </h2>

                    <div className="wardrobe-card-meta">
                      {getColor(item) && (
                        <span>
                          {formatValue(
                            getColor(item)
                          )}
                        </span>
                      )}

                      {item.garment
                        ?.material && (
                        <span>
                          {formatValue(
                            item.garment
                              .material
                          )}
                        </span>
                      )}

                      <span>
                        {intents.length}{" "}
                        {intents.length === 1
                          ? "style"
                          : "styles"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        )}

      {selectedItem && (
        <div
          className="wardrobe-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedItem(null);
            }
          }}
        >
          <div
            className="wardrobe-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={getName(
              selectedItem
            )}
          >
            <button
              type="button"
              className="wardrobe-detail-close"
              onClick={() =>
                setSelectedItem(null)
              }
              aria-label="Close"
            >
              ×
            </button>

            <div className="wardrobe-detail-grid">
              <div className="wardrobe-detail-image">
                {getPrimaryImage(
                  selectedItem
                ) ? (
                  <img
                    src={
                      getPrimaryImage(
                        selectedItem
                      ) || ""
                    }
                    alt={getName(
                      selectedItem
                    )}
                  />
                ) : (
                  <div className="wardrobe-no-image">
                    No reference
                  </div>
                )}
              </div>

              <div className="wardrobe-detail-content">
                <div className="wardrobe-eyebrow">
                  GARMENT
                </div>

                <h2>
                  {getName(selectedItem)}
                </h2>

                {getBrand(
                  selectedItem
                ) && (
                  <div className="wardrobe-detail-brand">
                    {getBrand(selectedItem)}
                  </div>
                )}

                <div className="wardrobe-detail-facts">
                  {[
                    [
                      "Type",
                      selectedItem.garment
                        ?.type ||
                        selectedItem.garment
                          ?.category ||
                        selectedItem.category,
                    ],
                    [
                      "Subtype",
                      selectedItem.garment
                        ?.subtype,
                    ],
                    [
                      "Color",
                      getColor(
                        selectedItem
                      ),
                    ],
                    [
                      "Material",
                      selectedItem.garment
                        ?.material,
                    ],
                    [
                      "Pattern",
                      selectedItem.garment
                        ?.pattern,
                    ],
                    [
                      "Fit",
                      selectedItem.garment
                        ?.fit ||
                        selectedItem.fit,
                    ],
                    [
                      "Length",
                      selectedItem.garment
                        ?.length ||
                        selectedItem.length,
                    ],
                    [
                      "Neckline",
                      selectedItem.garment
                        ?.neckline,
                    ],
                    [
                      "Sleeves",
                      selectedItem.garment
                        ?.sleeves,
                    ],
                  ]
                    .filter(
                      ([, value]) =>
                        typeof value ===
                          "string" &&
                        value.trim()
                          .length > 0
                    )
                    .map(
                      ([label, value]) => (
                        <div
                          key={label}
                          className="wardrobe-fact"
                        >
                          <span>
                            {label}
                          </span>

                          <strong>
                            {formatValue(
                              value
                            )}
                          </strong>
                        </div>
                      )
                    )}
                </div>

                {Array.isArray(
                  selectedItem.details
                ) &&
                  selectedItem.details
                    .length > 0 && (
                    <div className="wardrobe-detail-section">
                      <h3>
                        Details
                      </h3>

                      <div className="wardrobe-tags">
                        {selectedItem.details.map(
                          (detail) => (
                            <span
                              key={detail}
                            >
                              {formatValue(
                                detail
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {Array.isArray(
                  selectedItem.garment
                    ?.details
                ) &&
                  selectedItem.garment
                    ?.details.length >
                    0 && (
                    <div className="wardrobe-detail-section">
                      <h3>
                        Construction
                      </h3>

                      <div className="wardrobe-tags">
                        {selectedItem.garment.details.map(
                          (detail) => (
                            <span
                              key={detail}
                            >
                              {formatValue(
                                detail
                              )}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="wardrobe-detail-section">
                  <div className="wardrobe-section-heading">
                    <h3>
                      How Aparna Wears It
                    </h3>

                    <span>
                      {Array.isArray(
                        selectedItem.wearing_intents
                      )
                        ? selectedItem
                            .wearing_intents
                            .length
                        : 0}{" "}
                      styles
                    </span>
                  </div>

                  {Array.isArray(
                    selectedItem.wearing_intents
                  ) &&
                  selectedItem.wearing_intents
                    .length > 0 ? (
                    <div className="wearing-intent-list">
                      {selectedItem.wearing_intents.map(
                        (intent, index) => {
                          const details =
                            getIntentDetails(
                              intent
                            );

                          return (
                            <article
                              key={
                                intent.id ||
                                index
                              }
                              className="wearing-intent"
                            >
                              <div className="wearing-intent-header">
                                <div>
                                  <span>
                                    STYLE{" "}
                                    {String(
                                      index +
                                        1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>

                                  <h4>
                                    {intent.name ||
                                      `Wearing style ${
                                        index +
                                        1
                                      }`}
                                  </h4>
                                </div>
                              </div>

                              {intent.description && (
                                <p>
                                  {
                                    intent.description
                                  }
                                </p>
                              )}

                              {details.length >
                                0 && (
                                <div className="wearing-intent-details">
                                  {details.map(
                                    ([
                                      label,
                                      value,
                                    ]) => (
                                      <div
                                        key={
                                          label
                                        }
                                      >
                                        <span>
                                          {
                                            label
                                          }
                                        </span>

                                        <strong>
                                          {formatValue(
                                            value
                                          )}
                                        </strong>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}

                              {Array.isArray(
                                intent.preserve
                              ) &&
                                intent
                                  .preserve
                                  .length >
                                  0 && (
                                  <div className="intent-list-section">
                                    <h5>
                                      Preserve
                                    </h5>

                                    <ul>
                                      {intent.preserve.map(
                                        (
                                          value
                                        ) => (
                                          <li
                                            key={
                                              value
                                            }
                                          >
                                            {
                                              value
                                            }
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {Array.isArray(
                                intent.constraints
                              ) &&
                                intent
                                  .constraints
                                  .length >
                                  0 && (
                                  <div className="intent-list-section">
                                    <h5>
                                      Constraints
                                    </h5>

                                    <ul>
                                      {intent.constraints.map(
                                        (
                                          value
                                        ) => (
                                          <li
                                            key={
                                              value
                                            }
                                          >
                                            {
                                              value
                                            }
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </article>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="empty-intents">
                      No wearing style has
                      been defined yet.
                    </div>
                  )}
                </div>

                <div className="wardrobe-detail-actions">
                  <Link
                    href={`/?outfit=${encodeURIComponent(
                      selectedItem.id
                    )}`}
                    className="wardrobe-primary-button"
                  >
                    Use for Generation
                  </Link>

                  <button
                    type="button"
                    className="wardrobe-secondary-button"
                    onClick={() =>
                      setSelectedItem(null)
                    }
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .wardrobe-page {
          min-height: 100vh;
          padding: 42px 48px 80px;
          background:
            radial-gradient(
              circle at top right,
              rgba(255, 255, 255, 0.08),
              transparent 32%
            ),
            #0d0d0f;
          color: #f5f2ed;
        }

        .wardrobe-page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 32px;
          max-width: 1500px;
          margin: 0 auto 36px;
        }

        .wardrobe-eyebrow {
          font-size: 10px;
          letter-spacing: 0.22em;
          font-weight: 700;
          color: #99938b;
          margin-bottom: 9px;
        }

        .wardrobe-page-header h1 {
          margin: 0;
          font-size: clamp(34px, 4vw, 58px);
          line-height: 0.95;
          letter-spacing: -0.045em;
          font-weight: 500;
        }

        .wardrobe-page-header p {
          margin: 14px 0 0;
          color: #9c9892;
          font-size: 14px;
        }

        .wardrobe-back-link {
          color: #d9d3ca;
          text-decoration: none;
          font-size: 13px;
          border-bottom: 1px solid #45423e;
          padding-bottom: 5px;
        }

        .wardrobe-toolbar {
          max-width: 1500px;
          margin: 0 auto 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          border-top: 1px solid #252527;
          border-bottom: 1px solid #252527;
          padding: 14px 0;
        }

        .wardrobe-category-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .wardrobe-filter {
          border: 1px solid #303033;
          background: transparent;
          color: #99958f;
          border-radius: 999px;
          padding: 7px 13px;
          font-size: 11px;
          cursor: pointer;
        }

        .wardrobe-filter:hover,
        .wardrobe-filter.active {
          color: #111;
          background: #eee9e1;
          border-color: #eee9e1;
        }

        .wardrobe-count {
          flex-shrink: 0;
          color: #77736e;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .wardrobe-grid {
          max-width: 1500px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(
            4,
            minmax(0, 1fr)
          );
          gap: 18px;
        }

        .wardrobe-card {
          padding: 0;
          border: 1px solid #252527;
          background: #131315;
          color: inherit;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          transition:
            transform 180ms ease,
            border-color 180ms ease;
        }

        .wardrobe-card:hover {
          transform: translateY(-3px);
          border-color: #55514b;
        }

        .wardrobe-card-image {
          aspect-ratio: 0.82;
          background: #1a1a1d;
          overflow: hidden;
        }

        .wardrobe-card-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .wardrobe-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #66625d;
          font-size: 12px;
          background: #18181a;
        }

        .wardrobe-card-content {
          padding: 15px;
        }

        .wardrobe-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: #77736d;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .wardrobe-card h2 {
          margin: 8px 0 10px;
          font-size: 15px;
          line-height: 1.25;
          font-weight: 500;
          color: #eeeae4;
        }

        .wardrobe-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .wardrobe-card-meta span {
          color: #aaa59e;
          background: #1d1d20;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 9px;
        }

        .wardrobe-state {
          min-height: 360px;
          max-width: 1500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #77736e;
          text-align: center;
        }

        .wardrobe-state-title {
          color: #d9d4cd;
          font-size: 17px;
        }

        .wardrobe-state p {
          margin: 0;
          font-size: 13px;
        }

        .wardrobe-state.error
          .wardrobe-state-title {
          color: #c99d9d;
        }

        .wardrobe-state button {
          border: 1px solid #403c38;
          background: transparent;
          color: #ddd7cf;
          padding: 9px 15px;
          cursor: pointer;
        }

        .wardrobe-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 17px;
          background: #eee9e1;
          color: #111;
          border: 0;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .wardrobe-secondary-button {
          min-height: 40px;
          padding: 0 17px;
          background: transparent;
          color: #d7d2ca;
          border: 1px solid #39373a;
          font-size: 11px;
          cursor: pointer;
        }

        .wardrobe-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
        }

        .wardrobe-detail-modal {
          position: relative;
          width: min(1180px, 100%);
          max-height: calc(100vh - 60px);
          overflow: auto;
          background: #111113;
          border: 1px solid #303033;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5);
        }

        .wardrobe-detail-close {
          position: absolute;
          z-index: 3;
          top: 13px;
          right: 13px;
          width: 34px;
          height: 34px;
          border: 1px solid #3b3939;
          border-radius: 50%;
          background: rgba(15, 15, 17, 0.8);
          color: #e9e4dc;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
        }

        .wardrobe-detail-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.9fr) minmax(
              0,
              1.1fr
            );
          min-height: 650px;
        }

        .wardrobe-detail-image {
          background: #18181a;
          min-height: 500px;
        }

        .wardrobe-detail-image img {
          width: 100%;
          height: 100%;
          min-height: 500px;
          display: block;
          object-fit: cover;
        }

        .wardrobe-detail-content {
          padding: 44px;
        }

        .wardrobe-detail-content h2 {
          margin: 0;
          max-width: 600px;
          font-size: 34px;
          line-height: 1.03;
          font-weight: 500;
          letter-spacing: -0.035em;
        }

        .wardrobe-detail-brand {
          margin-top: 9px;
          color: #9b968e;
          font-size: 12px;
        }

        .wardrobe-detail-facts {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 1px;
          margin-top: 28px;
          border: 1px solid #28282b;
          background: #28282b;
        }

        .wardrobe-fact {
          padding: 12px;
          background: #111113;
        }

        .wardrobe-fact span,
        .wearing-intent-details span {
          display: block;
          color: #6f6b66;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          margin-bottom: 5px;
        }

        .wardrobe-fact strong,
        .wearing-intent-details strong {
          display: block;
          color: #d9d4cd;
          font-size: 11px;
          font-weight: 500;
        }

        .wardrobe-detail-section {
          margin-top: 28px;
        }

        .wardrobe-detail-section h3,
        .wardrobe-section-heading h3 {
          margin: 0;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #bcb6ae;
        }

        .wardrobe-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 11px;
        }

        .wardrobe-tags span {
          padding: 6px 9px;
          border: 1px solid #302f31;
          color: #aaa59e;
          font-size: 10px;
        }

        .wardrobe-section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .wardrobe-section-heading > span {
          color: #69655f;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .wearing-intent-list {
          display: grid;
          gap: 10px;
          margin-top: 12px;
        }

        .wearing-intent {
          padding: 15px;
          border: 1px solid #2a292b;
          background: #151517;
        }

        .wearing-intent-header {
          display: flex;
          justify-content: space-between;
        }

        .wearing-intent-header span {
          color: #6f6b66;
          font-size: 8px;
          letter-spacing: 0.14em;
        }

        .wearing-intent h4 {
          margin: 5px 0 0;
          color: #e0dbd4;
          font-size: 13px;
          font-weight: 500;
        }

        .wearing-intent > p {
          margin: 10px 0 0;
          color: #99948d;
          font-size: 11px;
          line-height: 1.6;
        }

        .wearing-intent-details {
          display: grid;
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          );
          gap: 10px;
          margin-top: 13px;
          padding-top: 13px;
          border-top: 1px solid #29282a;
        }

        .intent-list-section {
          margin-top: 13px;
          padding-top: 13px;
          border-top: 1px solid #29282a;
        }

        .intent-list-section h5 {
          margin: 0 0 7px;
          color: #706c66;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .intent-list-section ul {
          margin: 0;
          padding-left: 16px;
          color: #9a958e;
          font-size: 10px;
          line-height: 1.6;
        }

        .empty-intents {
          margin-top: 12px;
          padding: 15px;
          border: 1px dashed #302f31;
          color: #6e6963;
          font-size: 11px;
        }

        .wardrobe-detail-actions {
          display: flex;
          gap: 9px;
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid #29282a;
        }

        @media (max-width: 1100px) {
          .wardrobe-grid {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 820px) {
          .wardrobe-page {
            padding: 28px 20px 60px;
          }

          .wardrobe-page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .wardrobe-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .wardrobe-grid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }

          .wardrobe-detail-grid {
            grid-template-columns: 1fr;
          }

          .wardrobe-detail-image,
          .wardrobe-detail-image img {
            min-height: 360px;
            height: 360px;
          }

          .wardrobe-detail-content {
            padding: 28px 22px;
          }
        }

        @media (max-width: 520px) {
          .wardrobe-grid {
            grid-template-columns: 1fr;
          }

          .wardrobe-detail-facts,
          .wearing-intent-details {
            grid-template-columns: 1fr;
          }

          .wardrobe-modal-backdrop {
            padding: 10px;
          }

          .wardrobe-detail-modal {
            max-height: calc(100vh - 20px);
          }

          .wardrobe-detail-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}