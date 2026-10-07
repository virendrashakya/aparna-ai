"use client";



import { useMemo, useState } from "react";



type Tag = {
  id: string;
  label: string;
};

type ProductImageInput =
  | string
  | {
      id?: string;
      url?: string;
      src?: string;
      image?: string;
    };

type NormalizedImage = {
  id: string;
  url: string;
};

type Product = {
  name?: string;
  images?: ProductImageInput[];
  [key: string]: unknown;
};

type ImageTags = Record<string, string[]>;

type ImageTaggerProps = {
  product: Product | null | undefined;
  onAdded?: (item: unknown) => void;
  onCancel: () => void;
};

const TAGS: Tag[] = [

  { id: "front", label: "Front" },

  { id: "back", label: "Back" },

  { id: "side", label: "Side" },

  { id: "closeup_front", label: "Close-up Front" },

  { id: "closeup_back", label: "Close-up Back" },

  { id: "closeup_side", label: "Close-up Side" },

  { id: "dress_only", label: "Dress Only" },

];



function normalizeImages(images: ProductImageInput[] | undefined): NormalizedImage[] {

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

        typeof image === "object"

      ) {

        return {

          id:

            image.id ||

            `image_${index + 1}`,



          url:

            image.url ||

            image.src ||

            image.image ||

            "",

        };

      }



      return null;

    })

    .filter(
      (image): image is NormalizedImage =>
        image !== null && image.url.length > 0
    );

}



function getProxyUrl(url: string): string {

  if (!url) {

    return "";

  }



  /*
   * Product images are fetched through our
   * Next.js server so retailer CDN restrictions
   * don't prevent the browser from displaying them.
   */

  return `/api/wardrobe/image?url=${encodeURIComponent(

    url

  )}`;

}



export default function ImageTagger({
  product,
  onAdded,
  onCancel,
}: ImageTaggerProps) {

  const images = useMemo(

    () =>

      normalizeImages(

        product?.images

      ),

    [product]

  );



  const [selectedImage, setSelectedImage] = useState<string | null>(null);



  const [saving, setSaving] =

    useState(false);



  const [error, setError] =

    useState("");



  const [tags, setTags] = useState<ImageTags>(() => {

      const initial: ImageTags = {};



      images.forEach((image) => {

        initial[image.id] = [];

      });



      return initial;

    });



  function getTags(imageId: string): string[] {

    return tags[imageId] || [];

  }



  function toggleTag(tagId: string): void {

    if (!selectedImage) {

      return;

    }



    setTags((current) => {

      const currentTags =

        current[selectedImage] || [];



      if (

        currentTags.includes(tagId)

      ) {

        return {

          ...current,



          [selectedImage]:

            currentTags.filter(

              (tag) => tag !== tagId

            ),

        };

      }



      return {

        ...current,



        [selectedImage]: [

          ...currentTags,

          tagId,

        ],

      };

    });

  }



  function clearTags() {

    if (!selectedImage) {

      return;

    }



    setTags((current) => ({

      ...current,



      [selectedImage]: [],

    }));

  }



  function getImageForTag(tagId: string): NormalizedImage | null {

    const imageId =

      Object.keys(tags).find(

        (id) =>

          (

            tags[id] || []

          ).includes(tagId)

      );



    if (!imageId) {

      return null;

    }



    return images.find(
      (image) => image.id === imageId
    ) ?? null;

  }



  async function handleAdd(): Promise<void> {

    setError("");



    if (!product) {

      setError(

        "Product information is missing."

      );

      return;

    }



    if (!images.length) {

      setError(

        "No product images were found."

      );

      return;

    }



    setSaving(true);



    try {

      const imageTags =

        images.map((image) => ({

          id: image.id,

          url: image.url,

          tags:

            tags[image.id] || [],

        }));



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

              imageTags,

            }),

          }

        );



      const data =

        await response.json();



      if (!response.ok) {

        throw new Error(

          data?.error ||

            "Unable to add wardrobe item."

        );

      }



      onAdded?.(data.item);

    } catch (err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to add wardrobe item."
    );

    } finally {

      setSaving(false);

    }

  }



  if (!product) {

    return null;

  }



  return (

    <>

      <div className="tagger-overlay">

        <div className="tagger">



          <div className="tagger-header">

            <div>

              <div className="tagger-kicker">

                APARNA WARDROBE

              </div>



              <h2>

                Tag garment images

              </h2>



              <p>

                {product.name ||

                  "Wardrobe Item"}

              </p>

            </div>



            <button

              type="button"

              className="close-button"

              onClick={onCancel}

            >

              ×

            </button>

          </div>



          <div className="image-grid">

            {images.map(

              (image, index) => {

                const imageTags =

                  getTags(image.id);



                const selected =

                  selectedImage ===

                  image.id;



                return (

                  <button

                    key={image.id}

                    type="button"

                    className={`image-card ${

                      selected

                        ? "selected"

                        : ""

                    }`}

                    onClick={() =>

                      setSelectedImage(

                        image.id

                      )

                    }

                  >

                    <img

                      src={getProxyUrl(

                        image.url

                      )}

                      alt={

                        product.name ||

                        "Product"

                      }



                      onError={(event) => {

                        console.error(

                          "IMAGE LOAD FAILED:",

                          image.url

                        );



                        event.currentTarget.style.display =

                          "none";

                      }}

                    />



                    <span className="image-number">

                      {index + 1}

                    </span>



                    {selected && (

                      <span className="selected-check">

                        ✓

                      </span>

                    )}



                    {imageTags.length >

                      0 && (

                      <div className="image-tags">

                        {imageTags.map(

                          (tagId) => {

                            const tag =

                              TAGS.find(

                                (item) =>

                                  item.id ===

                                  tagId

                              );



                            return (

                              <span

                                key={

                                  tagId

                                }

                              >

                                {tag?.label ||

                                  tagId}

                              </span>

                            );

                          }

                        )}

                      </div>

                    )}

                  </button>

                );

              }

            )}

          </div>



          <div className="tag-section">

            <div className="selection-label">

              {selectedImage ? (

                <>

                  <span>

                    IMAGE{" "}

                    {images.findIndex(

                      (image) =>

                        image.id ===

                        selectedImage

                    ) + 1}

                  </span>



                  <strong>

                    Select image role

                  </strong>

                </>

              ) : (

                <span>

                  Select an image above

                  to tag it

                </span>

              )}

            </div>



            <div className="tag-buttons">

              {TAGS.map((tag) => {

                const active =

                  selectedImage &&

                  getTags(

                    selectedImage

                  ).includes(

                    tag.id

                  );



                return (

                  <button

                    key={tag.id}

                    type="button"

                    disabled={

                      !selectedImage

                    }

                    className={`tag-button ${

                      active

                        ? "active"

                        : ""

                    }`}

                    onClick={() =>

                      toggleTag(

                        tag.id

                      )

                    }

                  >

                    {active &&

                      "✓ "}

                    {tag.label}

                  </button>

                );

              })}

            </div>



            {selectedImage && (

              <button

                type="button"

                className="clear-button"

                onClick={clearTags}

              >

                Clear tags for this

                image

              </button>

            )}

          </div>



          <div className="reference-section">

            <div className="reference-title">

              GARMENT REFERENCES

            </div>



            <div className="reference-grid">

              {TAGS.map((tag) => {

                const image =

                  getImageForTag(

                    tag.id

                  );



                return (

                  <div

                    className="reference-card"

                    key={tag.id}

                  >

                    <div className="reference-label">

                      {tag.label}

                    </div>



                    {image ? (

                      <img

                        src={getProxyUrl(

                          image.url

                        )}

                        alt={

                          tag.label

                        }

                      />

                    ) : (

                      <div className="reference-empty">

                        —

                      </div>

                    )}

                  </div>

                );

              })}

            </div>

          </div>



          {error && (

            <div className="error">

              {error}

            </div>

          )}



          <div className="footer">

            <button

              type="button"

              className="cancel-button"

              onClick={onCancel}

              disabled={saving}

            >

              Cancel

            </button>



            <button

              type="button"

              className="add-button"

              onClick={handleAdd}

              disabled={saving}

            >

              {saving

                ? "Adding..."

                : "✓ Add To Wardrobe"}

            </button>

          </div>



        </div>

      </div>



      <style jsx>{`

        .tagger-overlay {

          position: fixed;

          inset: 0;

          z-index: 9999;

          display: flex;

          align-items: center;

          justify-content: center;

          padding: 24px;

          background: rgba(0, 0, 0, 0.8);

          backdrop-filter: blur(16px);

        }



        .tagger {

          width: min(1180px, 100%);

          max-height: 94vh;

          overflow-y: auto;

          border: 1px solid #292b2f;

          border-radius: 24px;

          background: #111214;

          color: #fff;

          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.7);

        }



        .tagger-header {

          display: flex;

          align-items: flex-start;

          justify-content: space-between;

          padding: 28px 30px 22px;

        }



        .tagger-kicker {

          margin-bottom: 7px;

          color: #777;

          font-size: 10px;

          font-weight: 700;

          letter-spacing: 0.18em;

        }



        .tagger-header h2 {

          margin: 0;

          font-size: 21px;

          font-weight: 600;

        }



        .tagger-header p {

          margin: 7px 0 0;

          color: #777;

          font-size: 13px;

        }



        .close-button {

          width: 38px;

          height: 38px;

          border: 0;

          border-radius: 50%;

          background: #202124;

          color: #aaa;

          font-size: 25px;

          cursor: pointer;

        }



        .image-grid {

          display: grid;

          grid-template-columns: repeat(

            auto-fit,

            minmax(150px, 1fr)

          );

          gap: 12px;

          padding: 0 30px 25px;

        }



        .image-card {

          position: relative;

          aspect-ratio: 3 / 4;

          overflow: hidden;

          padding: 0;

          border: 2px solid transparent;

          border-radius: 15px;

          background: #191a1d;

          cursor: pointer;

        }



        .image-card.selected {

          border-color: #36d7b7;

        }



        .image-card img {

          width: 100%;

          height: 100%;

          display: block;

          object-fit: cover;

        }



        .image-number {

          position: absolute;

          top: 9px;

          left: 9px;

          width: 28px;

          height: 28px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: rgba(0, 0, 0, 0.7);

          color: #fff;

          font-size: 11px;

          font-weight: 700;

        }



        .selected-check {

          position: absolute;

          top: 9px;

          right: 9px;

          width: 29px;

          height: 29px;

          display: flex;

          align-items: center;

          justify-content: center;

          border-radius: 50%;

          background: #36d7b7;

          color: #061510;

          font-weight: 800;

        }



        .image-tags {

          position: absolute;

          right: 7px;

          bottom: 7px;

          left: 7px;

          display: flex;

          flex-wrap: wrap;

          gap: 4px;

        }



        .image-tags span {

          padding: 4px 7px;

          border-radius: 6px;

          background: rgba(0, 0, 0, 0.8);

          color: #fff;

          font-size: 9px;

        }



        .tag-section {

          padding: 23px 30px;

          border-top: 1px solid #25272a;

          border-bottom: 1px solid #25272a;

        }



        .selection-label {

          display: flex;

          gap: 12px;

          align-items: center;

          margin-bottom: 14px;

          color: #777;

          font-size: 11px;

        }



        .selection-label strong {

          color: #ddd;

        }



        .tag-buttons {

          display: flex;

          flex-wrap: wrap;

          gap: 8px;

        }



        .tag-button {

          padding: 10px 14px;

          border: 1px solid #303236;

          border-radius: 9px;

          background: #191a1d;

          color: #aaa;

          font-size: 11px;

          cursor: pointer;

        }



        .tag-button.active {

          border-color: #36d7b7;

          background: rgba(54, 215, 183, 0.12);

          color: #36d7b7;

        }



        .tag-button:disabled {

          opacity: 0.35;

          cursor: not-allowed;

        }



        .clear-button {

          margin-top: 12px;

          padding: 0;

          border: 0;

          background: none;

          color: #666;

          font-size: 11px;

          cursor: pointer;

        }



        .reference-section {

          padding: 23px 30px;

        }



        .reference-title {

          margin-bottom: 13px;

          color: #666;

          font-size: 9px;

          letter-spacing: 0.16em;

        }



        .reference-grid {

          display: grid;

          grid-template-columns: repeat(7, 1fr);

          gap: 9px;

        }



        .reference-card {

          overflow: hidden;

          border: 1px solid #292b2e;

          border-radius: 9px;

          background: #18191b;

        }



        .reference-label {

          padding: 7px;

          overflow: hidden;

          color: #888;

          font-size: 8px;

          text-overflow: ellipsis;

          white-space: nowrap;

        }



        .reference-card img {

          width: 100%;

          aspect-ratio: 1;

          display: block;

          object-fit: cover;

        }



        .reference-empty {

          display: flex;

          align-items: center;

          justify-content: center;

          aspect-ratio: 1;

          color: #444;

          font-size: 20px;

        }



        .error {

          margin: 0 30px 20px;

          padding: 12px;

          border: 1px solid rgba(255, 70, 70, 0.25);

          border-radius: 9px;

          background: rgba(255, 70, 70, 0.08);

          color: #ff8c8c;

          font-size: 12px;

        }



        .footer {

          display: flex;

          justify-content: flex-end;

          gap: 10px;

          padding: 20px 30px 28px;

        }



        .cancel-button,

        .add-button {

          padding: 12px 18px;

          border-radius: 9px;

          font-size: 12px;

          cursor: pointer;

        }



        .cancel-button {

          border: 1px solid #303236;

          background: transparent;

          color: #999;

        }



        .add-button {

          border: 0;

          background: #36d7b7;

          color: #061510;

          font-weight: 700;

        }



        .add-button:disabled {

          opacity: 0.5;

          cursor: wait;

        }



        @media (max-width: 700px) {

          .tagger-overlay {

            padding: 10px;

          }



          .tagger-header,

          .tag-section,

          .reference-section {

            padding-left: 16px;

            padding-right: 16px;

          }



          .image-grid {

            grid-template-columns: repeat(2, 1fr);

            padding-right: 16px;

            padding-left: 16px;

          }



          .reference-grid {

            grid-template-columns: repeat(3, 1fr);

          }



          .footer {

            padding-right: 16px;

            padding-left: 16px;

          }

        }

      `}</style>

    </>

  );

}