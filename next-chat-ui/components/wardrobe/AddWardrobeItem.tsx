"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

type Analysis = {
  confidence: number | null;

  garment: {
    type: string;
    subtype: string | null;
    name: string;
    color: string | null;
    secondary_colors: string[];
    material: string | null;
    pattern: string | null;
    construction: string[];
    fit: string | null;
    length: string | null;
    neckline: string | null;
    sleeves: string | null;
    straps: string | null;
    details: string[];
  };

  wearing_intent: {
    name: string;
    description: string | null;
    waist_position: string | null;
    garment_position: string | null;
    fit: string | null;
    silhouette: string | null;
    neckline_position: string | null;
    sleeve_position: string | null;
    tuck: string | null;
    drape: string | null;
    layering: string | null;
    fastening: string | null;
    exposure_intent: string | null;
    preserve: string[];
    constraints: string[];
    accessories: string[];
  };

  notes: string[];
};

type UploadReference = {
  id: string;
  filename: string;
  local_path: string;
  mime_type: string;
  size: number;
};

type Props = {
  onAdded?: () => void;
};

function labelize(
  value: string | null | undefined
) {
  if (!value) {
    return "—";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function AddWardrobeItem({
  onAdded,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] =
    useState(false);

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [upload, setUpload] =
    useState<UploadReference | null>(
      null
    );

  const [analysis, setAnalysis] =
    useState<Analysis | null>(
      null
    );

  const [itemName, setItemName] =
    useState("");

  const [analyzing, setAnalyzing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function reset() {
    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    setFile(null);
    setPreview(null);
    setUpload(null);
    setAnalysis(null);
    setItemName("");
    setAnalyzing(false);
    setSaving(false);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function close() {
    if (
      analyzing ||
      saving
    ) {
      return;
    }

    setOpen(false);
    reset();
  }

  function handleFile(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (
      ![
        "image/jpeg",
        "image/jpg",
        "image/png",
      ].includes(
        selected.type.toLowerCase()
      )
    ) {
      setError(
        "Please choose a JPG, JPEG or PNG image."
      );
      return;
    }

    if (
      selected.size >
      20 * 1024 * 1024
    ) {
      setError(
        "Image must be 20MB or smaller."
      );
      return;
    }

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    setFile(selected);
    setPreview(
      URL.createObjectURL(
        selected
      )
    );
    setUpload(null);
    setAnalysis(null);
    setError("");

    const filename =
      selected.name
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]+/g, " ")
        .trim();

    setItemName(
      filename || ""
    );
  }

  async function analyze() {
    if (!file) {
      setError(
        "Upload an outfit photo first."
      );
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      const response =
        await fetch(
          "/api/wardrobe/analyze",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to analyze outfit."
        );
      }

      setUpload(
        data.upload
      );

      setAnalysis(
        data.analysis
      );

      if (
        !itemName.trim() &&
        data.analysis?.garment?.name
      ) {
        setItemName(
          data.analysis.garment.name
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze outfit."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function save() {
    if (
      !upload ||
      !analysis
    ) {
      setError(
        "Analyze the outfit before saving."
      );
      return;
    }

    const name =
      itemName.trim();

    if (!name) {
      setError(
        "Give this wardrobe item a name."
      );
      return;
    }

    if (name.length > 100) {
      setError(
        "Wardrobe item name must be 100 characters or less."
      );
      return;
    }

    setSaving(true);
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
              name,
              upload,
              analysis,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save wardrobe item."
        );
      }

      setOpen(false);
      reset();

      onAdded?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save wardrobe item."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError("");
        }}
        style={{
          border:
            "1px solid rgba(255,255,255,0.16)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
          color: "#fff",
          borderRadius: 10,
          padding: "11px 16px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          cursor: "pointer",
        }}
      >
        👗 ADD TO WARDROBE
      </button>

      {open && (
        <div
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              close();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background:
              "rgba(0,0,0,0.78)",
            backdropFilter:
              "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width:
                "min(1100px, 100%)",
              maxHeight: "92vh",
              overflow: "auto",
              background:
                "linear-gradient(145deg, #111217 0%, #090a0d 100%)",
              border:
                "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18,
              boxShadow:
                "0 30px 100px rgba(0,0,0,0.65)",
              color: "#fff",
            }}
          >
            <div
              style={{
                padding:
                  "22px 24px",
                borderBottom:
                  "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing:
                      "0.18em",
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
                  }}
                >
                  Add from photo
                </h2>

                <div
                  style={{
                    marginTop: 7,
                    color: "#777b85",
                    fontSize: 12,
                  }}
                >
                  AI extracts both the garment
                  and how it is being worn.
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                disabled={
                  analyzing ||
                  saving
                }
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(300px, 0.9fr) minmax(380px, 1.1fr)",
              }}
            >
              <div
                style={{
                  padding: 24,
                  borderRight:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    border:
                      "1px dashed rgba(255,255,255,0.18)",
                    borderRadius: 14,
                    minHeight: 420,
                    overflow: "hidden",
                    background:
                      "#15161b",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Uploaded wardrobe reference"
                      style={{
                        width: "100%",
                        height: 420,
                        objectFit:
                          "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        textAlign:
                          "center",
                        padding: 30,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 42,
                          marginBottom: 15,
                        }}
                      >
                        📷
                      </div>

                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        Upload an outfit photo
                      </div>

                      <div
                        style={{
                          color:
                            "#737783",
                          fontSize: 12,
                          lineHeight:
                            1.6,
                        }}
                      >
                        A photo from Instagram,
                        your gallery, a
                        screenshot, or a
                        fashion reference.
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={
                    handleFile
                  }
                  style={{
                    display: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    inputRef.current?.click()
                  }
                  disabled={
                    analyzing ||
                    saving
                  }
                  style={{
                    width: "100%",
                    marginTop: 14,
                    border:
                      "1px solid rgba(255,255,255,0.12)",
                    background:
                      "rgba(255,255,255,0.05)",
                    color: "#fff",
                    borderRadius: 10,
                    padding: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {file
                    ? "CHANGE PHOTO"
                    : "CHOOSE PHOTO"}
                </button>

                {file && (
                  <div
                    style={{
                      marginTop: 10,
                      color: "#737783",
                      fontSize: 10,
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {file.name}
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 24,
                }}
              >
                {!analysis && (
                  <>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 7,
                      }}
                    >
                      AI wardrobe extraction
                    </div>

                    <p
                      style={{
                        color:
                          "#777b85",
                        fontSize: 12,
                        lineHeight:
                          1.65,
                        marginTop: 0,
                      }}
                    >
                      Aparnas wardrobe will
                      remember not only what the
                      garment is, but the styling
                      seen in this reference.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        margin:
                          "22px 0",
                      }}
                    >
                      {[
                        "Garment type",
                        "Fabric and colour",
                        "Fit and silhouette",
                        "Waist / neckline placement",
                        "Tuck and drape",
                        "Layering",
                        "Styling constraints",
                      ].map(
                        (item) => (
                          <div
                            key={item}
                            style={{
                              padding:
                                "11px 12px",
                              border:
                                "1px solid rgba(255,255,255,0.07)",
                              borderRadius:
                                9,
                              color:
                                "#b8bbc3",
                              fontSize: 11,
                            }}
                          >
                            ✓ {item}
                          </div>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={analyze}
                      disabled={
                        !file ||
                        analyzing
                      }
                      style={{
                        width:
                          "100%",
                        border: "none",
                        borderRadius:
                          10,
                        padding: 14,
                        background:
                          !file ||
                          analyzing
                            ? "#292b31"
                            : "#fff",
                        color:
                          !file ||
                          analyzing
                            ? "#777b85"
                            : "#090a0d",
                        fontWeight: 800,
                        cursor:
                          !file ||
                          analyzing
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {analyzing
                        ? "ANALYZING WITH GROK..."
                        : "✦ ANALYZE OUTFIT"}
                    </button>
                  </>
                )}

                {analysis && (
                  <>
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 12,
                        marginBottom:
                          18,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            letterSpacing:
                              "0.14em",
                            color:
                              "#858995",
                            marginBottom:
                              5,
                          }}
                        >
                          DETECTED GARMENT
                        </div>

                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 750,
                          }}
                        >
                          {labelize(
                            analysis
                              .garment
                              .name
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          color:
                            "#a7f3d0",
                        }}
                      >
                        AI ANALYZED
                      </div>
                    </div>

                    <label
                      style={{
                        display:
                          "block",
                        fontSize: 10,
                        letterSpacing:
                          "0.14em",
                        color:
                          "#9ca3af",
                        fontWeight: 700,
                        marginBottom:
                          8,
                      }}
                    >
                      WARDROBE NAME
                    </label>

                    <input
                      value={
                        itemName
                      }
                      onChange={(
                        event
                      ) =>
                        setItemName(
                          event.target
                            .value
                        )
                      }
                      maxLength={100}
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        background:
                          "#15161b",
                        color:
                          "#fff",
                        border:
                          "1px solid rgba(255,255,255,0.12)",
                        borderRadius:
                          10,
                        padding:
                          "13px 14px",
                        outline:
                          "none",
                        fontSize: 14,
                        marginBottom:
                          18,
                      }}
                    />

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap: 8,
                        marginBottom:
                          18,
                      }}
                    >
                      {[
                        [
                          "TYPE",
                          analysis
                            .garment
                            .type,
                        ],
                        [
                          "COLOUR",
                          analysis
                            .garment
                            .color,
                        ],
                        [
                          "MATERIAL",
                          analysis
                            .garment
                            .material,
                        ],
                        [
                          "FIT",
                          analysis
                            .garment
                            .fit,
                        ],
                        [
                          "LENGTH",
                          analysis
                            .garment
                            .length,
                        ],
                        [
                          "SILHOUETTE",
                          analysis
                            .wearing_intent
                            .silhouette,
                        ],
                      ].map(
                        ([key, value]) => (
                          <div
                            key={key}
                            style={{
                              padding:
                                "10px 11px",
                              background:
                                "rgba(255,255,255,0.035)",
                              borderRadius:
                                8,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 8,
                                color:
                                  "#717580",
                                letterSpacing:
                                  "0.12em",
                              }}
                            >
                              {key}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  4,
                                fontSize:
                                  11,
                                color:
                                  "#d4d6dc",
                              }}
                            >
                              {labelize(
                                value
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    <div
                      style={{
                        padding:
                          "15px",
                        border:
                          "1px solid rgba(255,255,255,0.10)",
                        borderRadius:
                          12,
                        background:
                          "rgba(255,255,255,0.025)",
                        marginBottom:
                          15,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          letterSpacing:
                            "0.14em",
                          color:
                            "#9ca3af",
                          fontWeight: 700,
                          marginBottom:
                            8,
                        }}
                      >
                        WEARING INTENT
                      </div>

                      <div
                        style={{
                          fontSize:
                            15,
                          fontWeight:
                            700,
                          marginBottom:
                            7,
                        }}
                      >
                        {analysis
                          .wearing_intent
                          .name}
                      </div>

                      <div
                        style={{
                          color:
                            "#aeb2ba",
                          fontSize:
                            11,
                          lineHeight:
                            1.6,
                        }}
                      >
                        {analysis
                          .wearing_intent
                          .description ||
                          "Reference styling captured from the uploaded image."}
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 7,
                          marginTop:
                            13,
                        }}
                      >
                        {[
                          [
                            "WAIST",
                            analysis
                              .wearing_intent
                              .waist_position,
                          ],
                          [
                            "POSITION",
                            analysis
                              .wearing_intent
                              .garment_position,
                          ],
                          [
                            "FIT",
                            analysis
                              .wearing_intent
                              .fit,
                          ],
                          [
                            "TUCK",
                            analysis
                              .wearing_intent
                              .tuck,
                          ],
                          [
                            "DRAPE",
                            analysis
                              .wearing_intent
                              .drape,
                          ],
                          [
                            "LAYERING",
                            analysis
                              .wearing_intent
                              .layering,
                          ],
                        ].map(
                          ([key, value]) => (
                            <div
                              key={key}
                              style={{
                                fontSize:
                                  10,
                                color:
                                  "#aeb2ba",
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    "#6f737d",
                                  fontSize:
                                    8,
                                  letterSpacing:
                                    "0.08em",
                                }}
                              >
                                {key}
                              </strong>
                              <br />
                              {labelize(
                                value
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {analysis
                      .wearing_intent
                      .preserve
                      .length >
                      0 && (
                      <div
                        style={{
                          marginBottom:
                            15,
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              10,
                            letterSpacing:
                              "0.12em",
                            color:
                              "#9ca3af",
                            fontWeight:
                              700,
                            marginBottom:
                              7,
                          }}
                        >
                          PRESERVE
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: 5,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          {analysis
                            .wearing_intent
                            .preserve
                            .map(
                              (item) => (
                                <span
                                  key={
                                    item
                                  }
                                  style={{
                                    padding:
                                      "5px 7px",
                                    borderRadius:
                                      6,
                                    background:
                                      "rgba(167,243,208,0.08)",
                                    color:
                                      "#a7f3d0",
                                    fontSize:
                                      9,
                                  }}
                                >
                                  {item}
                                </span>
                              )
                            )}
                        </div>
                      </div>
                    )}

                    {error && (
                      <div
                        style={{
                          marginBottom:
                            12,
                          padding:
                            "10px 12px",
                          borderRadius:
                            9,
                          background:
                            "rgba(239,68,68,0.10)",
                          color:
                            "#fca5a5",
                          fontSize:
                            11,
                        }}
                      >
                        {error}
                      </div>
                    )}

                    <div
                      style={{
                        display:
                          "flex",
                        gap: 10,
                      }}
                    >
                      <button
                        type="button"
                        onClick={
                          analyze
                        }
                        disabled={
                          analyzing ||
                          saving
                        }
                        style={{
                          flex: 1,
                          border:
                            "1px solid rgba(255,255,255,0.12)",
                          borderRadius:
                            10,
                          padding:
                            13,
                          background:
                            "rgba(255,255,255,0.05)",
                          color:
                            "#fff",
                          fontWeight:
                            700,
                          cursor:
                            "pointer",
                        }}
                      >
                        ↻ REANALYZE
                      </button>

                      <button
                        type="button"
                        onClick={
                          save
                        }
                        disabled={
                          saving ||
                          analyzing
                        }
                        style={{
                          flex: 1,
                          border:
                            "none",
                          borderRadius:
                            10,
                          padding:
                            13,
                          background:
                            saving
                              ? "#292b31"
                              : "#fff",
                          color:
                            saving
                              ? "#777b85"
                              : "#090a0d",
                          fontWeight:
                            800,
                          cursor:
                            saving
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {saving
                          ? "SAVING..."
                          : "✓ SAVE TO WARDROBE"}
                      </button>
                    </div>
                  </>
                )}

                {error &&
                  !analysis && (
                    <div
                      style={{
                        marginTop: 15,
                        padding:
                          "10px 12px",
                        borderRadius: 9,
                        background:
                          "rgba(239,68,68,0.10)",
                        color:
                          "#fca5a5",
                        fontSize: 11,
                      }}
                    >
                      {error}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}