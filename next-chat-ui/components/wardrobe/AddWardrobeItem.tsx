"use client";

import { useState } from "react";

type Product = {
  name: string;
  brand: string | null;
  category: string;
  color: string | null;
  description: string | null;
  productUrl: string;
  retailer: string;
  productId: string | null;
  images: string[];
};

type Props = {
  onAdded?: () => void;
};

export default function AddWardrobeItem({
  onAdded,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [url, setUrl] =
    useState("");

  const [product, setProduct] =
    useState<Product | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [adding, setAdding] =
    useState(false);

  const [error, setError] =
    useState("");

  async function fetchProduct() {
    setLoading(true);
    setError("");
    setProduct(null);

    try {
      const response =
        await fetch(
          "/api/wardrobe/fetch",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              url,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to fetch product."
        );
      }

      setProduct(
        data.product
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function addToWardrobe() {
    if (!product) {
      return;
    }

    setAdding(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/wardrobe/add",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              product,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to add wardrobe item."
        );
      }

      setUrl("");
      setProduct(null);
      setOpen(false);

      onAdded?.();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to add wardrobe item."
      );
    } finally {
      setAdding(false);
    }
  }

  function close() {
    if (
      loading ||
      adding
    ) {
      return;
    }

    setOpen(false);
    setProduct(null);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        className="wardrobe-add-button"
        onClick={() =>
          setOpen(true)
        }
      >
        👗 ADD TO WARDROBE
      </button>

      {open && (
        <div
          className="wardrobe-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              close();
            }
          }}
        >
          <div className="wardrobe-modal">
            <div className="wardrobe-modal-header">
              <div>
                <div className="eyebrow">
                  APARNA WARDROBE
                </div>

                <h2>
                  Add garment
                </h2>
              </div>

              <button
                type="button"
                onClick={close}
                disabled={
                  loading ||
                  adding
                }
                className="modal-close"
              >
                ×
              </button>
            </div>

            {!product && (
              <>
                <label className="wardrobe-label">
                  PRODUCT URL
                </label>

                <input
                  className="wardrobe-url-input"
                  value={url}
                  onChange={(event) =>
                    setUrl(
                      event.target.value
                    )
                  }
                  placeholder="Paste Myntra, AJIO, Flipkart or Meesho product URL"
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      fetchProduct();
                    }
                  }}
                />

                <p className="wardrobe-help">
                  The product page will be
                  inspected and its available
                  product images will be stored
                  locally as a wardrobe reference.
                </p>

                {error && (
                  <div className="wardrobe-error">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  className="generate-button"
                  onClick={
                    fetchProduct
                  }
                  disabled={
                    loading ||
                    !url.trim()
                  }
                >
                  {loading
                    ? "FETCHING PRODUCT..."
                    : "FETCH PRODUCT"}
                </button>
              </>
            )}

            {product && (
              <>
                <div className="wardrobe-preview-grid">
                  {product.images
                    .slice(0, 4)
                    .map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          className="wardrobe-product-image"
                          key={`${image}-${index}`}
                        >
                          <img
                            src={
                              image
                            }
                            alt={
                              product.name
                            }
                          />
                        </div>
                      )
                    )}
                </div>

                <div className="wardrobe-product-info">
                  <div className="wardrobe-retailer">
                    {
                      product.retailer
                    }
                  </div>

                  <h3>
                    {
                      product.name
                    }
                  </h3>

                  {product.brand && (
                    <div>
                      {
                        product.brand
                      }
                    </div>
                  )}

                  <div className="wardrobe-meta">
                    <span>
                      {
                        product.category
                      }
                    </span>

                    {product.productId && (
                      <span>
                        ID:{" "}
                        {
                          product.productId
                        }
                      </span>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="wardrobe-error">
                    {error}
                  </div>
                )}

                <div className="wardrobe-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setProduct(null)
                    }
                    disabled={
                      adding
                    }
                  >
                    ← CHANGE
                  </button>

                  <button
                    type="button"
                    className="approve"
                    onClick={
                      addToWardrobe
                    }
                    disabled={
                      adding
                    }
                  >
                    {adding
                      ? "ADDING..."
                      : "✓ ADD TO WARDROBE"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}