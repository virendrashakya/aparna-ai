"use client";

import { useMemo, useState } from "react";

type ProductImage = {
  id: string;
  url: string;
};

type Product = {
  name: string;
  brand: string | null;
  category: string;
  color: string | null;
  description: string | null;
  productUrl: string;
  retailer: string;
  productId: string | null;
  images: ProductImage[];
};

type ImageTag = {
  id: string;
  url: string;
  tags: string[];
};

type Props = {
  onAdded?: () => void;
};

const TAGS = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "side", label: "Side" },
  { id: "closeup_front", label: "Close-up Front" },
  { id: "closeup_back", label: "Close-up Back" },
  { id: "closeup_side", label: "Close-up Side" },
  { id: "dress_only", label: "Dress Only" },
] as const;

type TagId = (typeof TAGS)[number]["id"];

const TAG_LABELS: Record<string, string> = Object.fromEntries(
  TAGS.map((tag) => [tag.id, tag.label])
);

function normalizeImages(images: unknown): ProductImage[] {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .map((image, index) => {
      if (typeof image === "string") {
        return {
          id: `image_${index + 1}`,
          url: image,
        };
      }

      if (
        image &&
        typeof image === "object" &&
        "url" in image &&
        typeof image.url === "string"
      ) {
        const imageObject = image as {
          id?: unknown;
          url: string;
        };

        return {
          id:
            typeof imageObject.id === "string"
              ? imageObject.id
              : `image_${index + 1}`,
          url: imageObject.url,
        };
      }

      return null;
    })
    .filter((image): image is ProductImage => image !== null);
}

function proxyImageUrl(url: string): string {
  return `/api/wardrobe/image?url=${encodeURIComponent(url)}`;
}

export default function AddWardrobeItem({ onAdded }: Props) {
  const [open, setOpen] = useState(false);

  const [url, setUrl] = useState("");

  const [product, setProduct] = useState<Product | null>(null);

  const [itemName, setItemName] = useState("");

  const [selectedImageId, setSelectedImageId] = useState<string | null>(
    null
  );

  const [imageTags, setImageTags] = useState<Record<string, string[]>>({});

  const [loading, setLoading] = useState(false);

  const [adding, setAdding] = useState(false);

  const [error, setError] = useState("");

  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const normalizedProductImages = useMemo(() => {
    if (!product) {
      return [];
    }

    return normalizeImages(product.images);
  }, [product]);

  const selectedImage = useMemo(() => {
    if (!selectedImageId) {
      return null;
    }

    return (
      normalizedProductImages.find(
        (image) => image.id === selectedImageId
      ) ?? null
    );
  }, [normalizedProductImages, selectedImageId]);

  const taggedImageCount = useMemo(() => {
    return normalizedProductImages.filter(
      (image) => (imageTags[image.id] ?? []).length > 0
    ).length;
  }, [normalizedProductImages, imageTags]);

  const referenceSummary = useMemo(() => {
    const summary: Record<string, ProductImage | null> = {};

    for (const tag of TAGS) {
      summary[tag.id] = null;
    }

    for (const image of normalizedProductImages) {
      const tags = imageTags[image.id] ?? [];

      for (const tag of tags) {
        if (!summary[tag]) {
          summary[tag] = image;
        }
      }
    }

    return summary;
  }, [normalizedProductImages, imageTags]);

  async function fetchProduct() {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Paste a product URL first.");
      return;
    }

    setLoading(true);
    setError("");
    setProduct(null);
    setItemName("");
    setSelectedImageId(null);
    setImageTags({});
    setImageErrors({});

    try {
      const response = await fetch("/api/wardrobe/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: trimmedUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch product.");
      }

      if (!data.product) {
        throw new Error("No product data was returned.");
      }

      const normalizedImages = normalizeImages(data.product.images);

      const normalizedProduct: Product = {
        ...data.product,
        images: normalizedImages,
      };

      setProduct(normalizedProduct);

      /*
       * Pre-fill the custom wardrobe name with the retailer's
       * product name. User can change it before saving.
       */
      setItemName(data.product.name?.trim() || "");

      if (normalizedImages.length > 0) {
        setSelectedImageId(normalizedImages[0].id);
      }

      const initialTags: Record<string, string[]> = {};

      for (const image of normalizedImages) {
        initialTags[image.id] = [];
      }

      setImageTags(initialTags);

      if (normalizedImages.length === 0) {
        setError(
          "Product details were found, but no product images were returned."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching the product."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(tagId: TagId) {
    if (!selectedImageId) {
      return;
    }

    setImageTags((current) => {
      const currentTags = current[selectedImageId] ?? [];

      const exists = currentTags.includes(tagId);

      return {
        ...current,
        [selectedImageId]: exists
          ? currentTags.filter((tag) => tag !== tagId)
          : [...currentTags, tagId],
      };
    });
  }

  function clearSelectedImageTags() {
    if (!selectedImageId) {
      return;
    }

    setImageTags((current) => ({
      ...current,
      [selectedImageId]: [],
    }));
  }

  function clearAllTags() {
    setImageTags(() => {
      const next: Record<string, string[]> = {};

      for (const image of normalizedProductImages) {
        next[image.id] = [];
      }

      return next;
    });
  }

  function isTagSelected(tagId: string): boolean {
    if (!selectedImageId) {
      return false;
    }

    return (imageTags[selectedImageId] ?? []).includes(tagId);
  }

  function getImageTagsPayload(): ImageTag[] {
    return normalizedProductImages.map((image) => ({
      id: image.id,
      url: image.url,
      tags: imageTags[image.id] ?? [],
    }));
  }

  async function addToWardrobe() {
    if (!product) {
      return;
    }

    const trimmedName = itemName.trim();

    if (!trimmedName) {
      setError("Please give this wardrobe item a name.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Wardrobe item name must be 100 characters or less.");
      return;
    }

    if (normalizedProductImages.length === 0) {
      setError("At least one product image is required.");
      return;
    }

    const payload = getImageTagsPayload();

    setAdding(true);
    setError("");

    try {
      const response = await fetch("/api/wardrobe/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product,
          name: trimmedName,
          imageTags: payload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add wardrobe item.");
      }

      setUrl("");
      setProduct(null);
      setItemName("");
      setSelectedImageId(null);
      setImageTags({});
      setImageErrors({});
      setError("");
      setOpen(false);

      onAdded?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add wardrobe item."
      );
    } finally {
      setAdding(false);
    }
  }

  function close() {
    if (loading || adding) {
      return;
    }

    setOpen(false);
    setProduct(null);
    setItemName("");
    setSelectedImageId(null);
    setImageTags({});
    setImageErrors({});
    setError("");
  }

  function handleImageError(imageId: string) {
    setImageErrors((current) => ({
      ...current,
      [imageId]: true,
    }));
  }

  function getTagCount(imageId: string): number {
    return (imageTags[imageId] ?? []).length;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          border: "1px solid rgba(255,255,255,0.16)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
          color: "#fff",
          borderRadius: 10,
          padding: "11px 16px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          cursor: "pointer",
          backdropFilter: "blur(10px)",
        }}
      >
        👗 ADD TO WARDROBE
      </button>

      {open && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.76)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "min(1180px, 100%)",
              maxHeight: "92vh",
              overflow: "auto",
              background:
                "linear-gradient(145deg, #111217 0%, #090a0d 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              boxShadow: "0 30px 100px rgba(0,0,0,0.65)",
              color: "#fff",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "22px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    color: "#9ca3af",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  APARNA WARDROBE
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 650,
                  }}
                >
                  Add garment
                </h2>
              </div>

              <button
                type="button"
                onClick={close}
                disabled={loading || adding}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 24,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* URL INPUT */}
            {!product && (
              <div style={{ padding: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: "#9ca3af",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  PRODUCT URL
                </label>

                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !loading) {
                      fetchProduct();
                    }
                  }}
                  placeholder="Paste Myntra, AJIO, Flipkart or Meesho product URL"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#15161b",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "14px 15px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />

                <p
                  style={{
                    color: "#8b909b",
                    fontSize: 12,
                    lineHeight: 1.6,
                    margin: "10px 0 18px",
                  }}
                >
                  Paste a product URL to import its details and product
                  images.
                </p>

                {error && (
                  <div
                    style={{
                      background: "rgba(239,68,68,0.10)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#fca5a5",
                      borderRadius: 10,
                      padding: "11px 13px",
                      fontSize: 12,
                      marginBottom: 15,
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={fetchProduct}
                  disabled={loading || !url.trim()}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 10,
                    padding: "14px 18px",
                    background:
                      loading || !url.trim() ? "#292b31" : "#fff",
                    color:
                      loading || !url.trim() ? "#777b85" : "#090a0d",
                    fontWeight: 750,
                    fontSize: 12,
                    letterSpacing: "0.08em",
                    cursor:
                      loading || !url.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "FETCHING PRODUCT..." : "FETCH PRODUCT"}
                </button>
              </div>
            )}

            {/* PRODUCT */}
            {product && (
              <div>
                {/* PRODUCT NAME + INFORMATION */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      color: "#9ca3af",
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    WARDROBE ITEM NAME
                  </label>

                  <input
                    value={itemName}
                    onChange={(event) => setItemName(event.target.value)}
                    maxLength={100}
                    placeholder="e.g. Black Evening Bodycon"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      background: "#15161b",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      padding: "13px 14px",
                      outline: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      marginBottom: 15,
                    }}
                  />

                  <div
                    style={{
                      color: "#70747e",
                      fontSize: 10,
                      marginBottom: 18,
                    }}
                  >
                    This is Aparna's wardrobe name. The original retailer
                    product name remains available as source information.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 20,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#9ca3af",
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          fontWeight: 700,
                          marginBottom: 5,
                        }}
                      >
                        {product.retailer?.toUpperCase()}
                      </div>

                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          lineHeight: 1.3,
                          color: "#d9dce2",
                          fontWeight: 500,
                        }}
                      >
                        {product.name}
                      </h3>

                      <div
                        style={{
                          marginTop: 8,
                          color: "#777b85",
                          fontSize: 11,
                        }}
                      >
                        {product.brand || "Unknown brand"}
                        {" · "}
                        {product.category || "Unknown category"}
                        {product.color ? ` · ${product.color}` : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11,
                        color: "#a7f3d0",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#34d399",
                          display: "inline-block",
                        }}
                      />

                      {normalizedProductImages.length} images
                    </div>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      margin: "16px 24px 0",
                      background: "rgba(239,68,68,0.10)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#fca5a5",
                      borderRadius: 10,
                      padding: "11px 13px",
                      fontSize: 12,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* MAIN IMAGE TAGGER */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1.6fr) minmax(300px, 0.8fr)",
                    minHeight: 520,
                  }}
                >
                  {/* IMAGE GRID */}
                  <div
                    style={{
                      padding: 24,
                      borderRight: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                        gap: 15,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          Product images
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            color: "#7f8490",
                            fontSize: 11,
                          }}
                        >
                          Select an image, then assign one or more reference
                          roles.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={clearAllTags}
                        disabled={taggedImageCount === 0}
                        style={{
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "transparent",
                          color:
                            taggedImageCount === 0
                              ? "#555861"
                              : "#c8cbd2",
                          borderRadius: 8,
                          padding: "8px 10px",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor:
                            taggedImageCount === 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        CLEAR ALL
                      </button>
                    </div>

                    {normalizedProductImages.length === 0 ? (
                      <div
                        style={{
                          border: "1px dashed rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          minHeight: 300,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#777b85",
                          fontSize: 13,
                        }}
                      >
                        No product images available.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(155px, 1fr))",
                          gap: 12,
                        }}
                      >
                        {normalizedProductImages.map((image, index) => {
                          const selected = image.id === selectedImageId;
                          const tags = imageTags[image.id] ?? [];
                          const broken = imageErrors[image.id];

                          return (
                            <button
                              key={image.id}
                              type="button"
                              onClick={() => setSelectedImageId(image.id)}
                              style={{
                                position: "relative",
                                padding: 0,
                                border: selected
                                  ? "2px solid #fff"
                                  : "1px solid rgba(255,255,255,0.10)",
                                borderRadius: 12,
                                background: "#15161b",
                                overflow: "hidden",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <div
                                style={{
                                  position: "relative",
                                  aspectRatio: "3 / 4",
                                  background: "#202127",
                                  overflow: "hidden",
                                }}
                              >
                                {!broken ? (
                                  <img
                                    src={proxyImageUrl(image.url)}
                                    alt={`Product image ${index + 1}`}
                                    onError={() => handleImageError(image.id)}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                      display: "block",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      padding: 15,
                                      boxSizing: "border-box",
                                      color: "#777b85",
                                      fontSize: 11,
                                      textAlign: "center",
                                    }}
                                  >
                                    Image could not be loaded
                                  </div>
                                )}

                                {selected && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      boxShadow:
                                        "inset 0 0 0 2px rgba(255,255,255,0.45)",
                                      pointerEvents: "none",
                                    }}
                                  />
                                )}
                              </div>

                              <div
                                style={{
                                  padding: "9px 10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "#a4a8b1",
                                      fontWeight: 700,
                                    }}
                                  >
                                    IMAGE {index + 1}
                                  </span>

                                  {tags.length > 0 && (
                                    <span
                                      style={{
                                        background: "#fff",
                                        color: "#111",
                                        borderRadius: 999,
                                        minWidth: 20,
                                        height: 20,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 10,
                                        fontWeight: 800,
                                      }}
                                    >
                                      {tags.length}
                                    </span>
                                  )}
                                </div>

                                {tags.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: 6,
                                      display: "flex",
                                      gap: 4,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {tags.map((tag) => (
                                      <span
                                        key={tag}
                                        style={{
                                          fontSize: 8,
                                          color: "#cbd0d8",
                                          background:
                                            "rgba(255,255,255,0.07)",
                                          borderRadius: 5,
                                          padding: "3px 5px",
                                        }}
                                      >
                                        {TAG_LABELS[tag] ?? tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* TAG PANEL */}
                  <div
                    style={{
                      padding: 24,
                      background: "rgba(255,255,255,0.018)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 5,
                      }}
                    >
                      Reference tagging
                    </div>

                    <div
                      style={{
                        color: "#7f8490",
                        fontSize: 11,
                        lineHeight: 1.5,
                        marginBottom: 18,
                      }}
                    >
                      Tell Aparna's image engine what each product image
                      represents.
                    </div>

                    {selectedImage ? (
                      <>
                        <div
                          style={{
                            borderRadius: 12,
                            overflow: "hidden",
                            background: "#15161b",
                            border: "1px solid rgba(255,255,255,0.08)",
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              aspectRatio: "1 / 1",
                              background: "#202127",
                            }}
                          >
                            {!imageErrors[selectedImage.id] ? (
                              <img
                                src={proxyImageUrl(selectedImage.url)}
                                alt="Selected product reference"
                                onError={() =>
                                  handleImageError(selectedImage.id)
                                }
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#777b85",
                                  fontSize: 11,
                                  padding: 20,
                                  boxSizing: "border-box",
                                  textAlign: "center",
                                }}
                              >
                                Image could not be loaded through the image
                                proxy.
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                          }}
                        >
                          {TAGS.map((tag) => {
                            const active = isTagSelected(tag.id);

                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                style={{
                                  border: active
                                    ? "1px solid #fff"
                                    : "1px solid rgba(255,255,255,0.10)",
                                  background: active
                                    ? "#fff"
                                    : "rgba(255,255,255,0.035)",
                                  color: active ? "#090a0d" : "#c8cbd2",
                                  borderRadius: 8,
                                  padding: "10px 8px",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textAlign: "center",
                                }}
                              >
                                {active ? "✓ " : ""}
                                {tag.label}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={clearSelectedImageTags}
                          disabled={getTagCount(selectedImage.id) === 0}
                          style={{
                            width: "100%",
                            marginTop: 10,
                            padding: 9,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "transparent",
                            color:
                              getTagCount(selectedImage.id) === 0
                                ? "#555861"
                                : "#aeb2ba",
                            borderRadius: 8,
                            fontSize: 10,
                            cursor:
                              getTagCount(selectedImage.id) === 0
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          CLEAR IMAGE TAGS
                        </button>
                      </>
                    ) : (
                      <div
                        style={{
                          minHeight: 250,
                          border: "1px dashed rgba(255,255,255,0.10)",
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6f737d",
                          fontSize: 12,
                          textAlign: "center",
                          padding: 20,
                        }}
                      >
                        Select a product image to start tagging.
                      </div>
                    )}

                    {/* REFERENCE SUMMARY */}
                    <div
                      style={{
                        marginTop: 22,
                        paddingTop: 18,
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 10,
                        }}
                      >
                        Reference map
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 7,
                        }}
                      >
                        {TAGS.map((tag) => {
                          const image = referenceSummary[tag.id];

                          return (
                            <div
                              key={tag.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 10,
                                fontSize: 10,
                              }}
                            >
                              <span
                                style={{
                                  color: "#aeb2ba",
                                }}
                              >
                                {tag.label}
                              </span>

                              <span
                                style={{
                                  color: image ? "#a7f3d0" : "#555861",
                                  fontWeight: 700,
                                }}
                              >
                                {image ? "ASSIGNED" : "NOT ASSIGNED"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 15,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      color: "#7f8490",
                      fontSize: 11,
                    }}
                  >
                    {taggedImageCount} of {normalizedProductImages.length}{" "}
                    images tagged
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setProduct(null);
                        setItemName("");
                        setSelectedImageId(null);
                        setImageTags({});
                        setImageErrors({});
                        setError("");
                      }}
                      disabled={adding}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.035)",
                        color: "#c8cbd2",
                        borderRadius: 9,
                        padding: "11px 15px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      CHANGE PRODUCT
                    </button>

                    <button
                      type="button"
                      onClick={addToWardrobe}
                      disabled={
                        adding ||
                        normalizedProductImages.length === 0 ||
                        !itemName.trim()
                      }
                      style={{
                        border: "none",
                        background:
                          adding ||
                          normalizedProductImages.length === 0 ||
                          !itemName.trim()
                            ? "#30323a"
                            : "#fff",
                        color:
                          adding ||
                          normalizedProductImages.length === 0 ||
                          !itemName.trim()
                            ? "#777b85"
                            : "#090a0d",
                        borderRadius: 9,
                        padding: "11px 18px",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.07em",
                        cursor:
                          adding ||
                          normalizedProductImages.length === 0 ||
                          !itemName.trim()
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {adding ? "SAVING..." : "ADD TO WARDROBE"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}